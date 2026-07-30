import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl, Image } from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { cache } from '../lib/cache';
import { IssuedCredential } from '../lib/types';
import { usePreferences } from '../lib/theme-context';
import { haptics } from '../lib/haptics';
import { ShareIdModal } from '../components/ShareIdModal';
import { StatusBar } from 'expo-status-bar';

export function WalletHomeScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { isDark } = usePreferences();
  const [credentials, setCredentials] = useState<IssuedCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  React.useEffect(() => {
    const scanResult = route.params?.scanResult;
    if (scanResult) {
      try {
        const parsed = JSON.parse(scanResult);
        if (parsed.claimCode) {
          navigation.navigate('Claim', { prefillCode: parsed.claimCode });
        } else if (parsed.vcId) {
          navigation.navigate('CredentialDetail', { id: parsed.vcId });
        }
      } catch {
        if (scanResult && scanResult.length === 8) {
          navigation.navigate('Claim', { prefillCode: scanResult });
        }
      }
      navigation.setParams({ scanResult: undefined });
    }
  }, [route.params?.scanResult]);

  const loadCredentials = async () => {
    try {
      const cached = await cache.getCredentials();
      if (cached.length > 0) {
        setCredentials(cached);
        setLoading(false);
      }

      const { data, error } = await supabase
        .from('issued_credentials')
        .select('*')
        .eq('subject_user_id', user?.id)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      const fresh = data || [];
      setCredentials(fresh);
      await cache.setCredentials(fresh);
    } catch {
      // silent - cached data will be shown
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const primaryCred = credentials[0];
  const holderName = primaryCred
    ? `${primaryCred.given_name} ${primaryCred.family_name}`
    : (user?.email?.split('@')[0] || 'Holder');
  const holderDid = primaryCred?.subject_did || `did:key:z6M${user?.id?.replace(/-/g, '').substring(0, 16)}`;
  const displayDid = `${holderDid.substring(0, 18)}...${holderDid.substring(holderDid.length - 6)}`;

  const getDaysUntilExpiry = (cred: IssuedCredential) => {
    if (!cred.claim_code_expires_at) return null;
    const now = new Date();
    const expiry = new Date(cred.claim_code_expires_at);
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const themed = {
    container: { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
    header: { backgroundColor: isDark ? '#1e293b' : '#0f172a' },
    sectionTitle: { color: isDark ? '#e2e8f0' : '#0f172a' },
    card: { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#f1f5f9' },
    credName: { color: isDark ? '#e2e8f0' : '#0f172a' },
    expiryBadge: { backgroundColor: '#fef3c7' },
    expiryText: { color: '#92400e' },
  };

  return (
    <SafeAreaView style={[styles.container, themed.container]}>
      <StatusBar style="light" />
      <FlatList
        data={credentials}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { haptics.light(); setRefreshing(true); loadCredentials(); }} />}
        ListHeaderComponent={
          <>
            <View style={[styles.header, themed.header]}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.headerLabel}>RefugeeID Wallet</Text>
                  <View style={styles.verifiedBadge}>
                    <View style={styles.greenDot} />
                    <Text style={styles.verifiedText}>Verified Identity</Text>
                  </View>
                </View>
                <Text style={styles.shield}>{'\ud83d\udee1\ufe0f'}</Text>
              </View>
              <Text style={styles.holderName}>{holderName}</Text>
              <Text style={styles.holderDid}>{displayDid}</Text>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.shareIdButton}
                  onPress={() => { haptics.light(); setShowShareModal(true); }}
                >
                  <Text style={styles.shareIdButtonText}>{'\ud83d\udd17'} Share ID</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => { haptics.light(); navigation.navigate('QRScanner'); }}
                >
                  <Text style={styles.scanButtonText}>{'\ud83d\udcf7'} Scan QR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => { haptics.light(); navigation.navigate('Claim'); }}
                >
                  <Text style={styles.claimButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, themed.sectionTitle]}>My Credentials</Text>
              <Text style={styles.sectionCount}>{credentials.length} items</Text>
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const daysLeft = getDaysUntilExpiry(item);
          return (
            <TouchableOpacity
              style={[styles.credentialCard, themed.card]}
              onPress={() => navigation.navigate('CredentialDetail', { id: item.id })}
            >
              <View style={styles.credIcon}>
                {item.face_image_url ? (
                  <Image source={{ uri: item.face_image_url }} style={styles.faceThumb} />
                ) : (
                  <Text style={styles.credIconText}>{'\ud83d\udee1\ufe0f'}</Text>
                )}
              </View>
              <View style={styles.credInfo}>
                <Text style={[styles.credName, themed.credName]}>{item.given_name} {item.family_name}</Text>
                <Text style={styles.credMeta}>UNHCR {'\u2022'} Case {item.case_number}</Text>
                {daysLeft !== null && daysLeft <= 30 && (
                  <View style={[styles.expiryBadge, themed.expiryBadge]}>
                    <Text style={[styles.expiryText, themed.expiryText]}>
                      {daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} days`}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={item.status === 'active' ? styles.statusActive : styles.statusRevoked}>
                {item.status === 'active' ? '\u2713' : '\u2717'}
              </Text>
              <Text style={styles.chevron}>{'\u203a'}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={[styles.empty, { borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
              <Text style={styles.emptyIcon}>{'\ud83d\udcc4'}</Text>
              <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>No credentials yet.</Text>
              <Text style={styles.emptySubtext}>Claim one using the button above.</Text>
            </View>
          ) : null
        }
      />

      <ShareIdModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        did={holderDid}
        holderName={holderName}
        credentialId={primaryCred?.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 20 },
  header: { padding: 24, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerLabel: { color: '#93c5fd', fontSize: 13, fontWeight: '500' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34d399', marginRight: 6 },
  verifiedText: { color: '#bfdbfe', fontSize: 11, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 1 },
  shield: { fontSize: 28 },
  holderName: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  holderDid: { color: '#93c5fd', fontSize: 12, fontFamily: 'monospace', opacity: 0.8, marginBottom: 20 },
  headerActions: { flexDirection: 'row', gap: 8 },
  shareIdButton: { flex: 2, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  shareIdButtonText: { color: '#0f172a', fontWeight: '600', fontSize: 13 },
  scanButton: { flex: 1, backgroundColor: '#1d4ed8', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  scanButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  claimButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  claimButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionCount: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  credentialCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, borderWidth: 1 },
  credIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  credIconText: { fontSize: 22 },
  faceThumb: { width: 48, height: 48, borderRadius: 24 },
  credInfo: { flex: 1 },
  credName: { fontSize: 15, fontWeight: '600' },
  credMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  expiryBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  expiryText: { fontSize: 11, fontWeight: '600' },
  statusActive: { color: '#10b981', fontSize: 18, fontWeight: 'bold', marginRight: 4 },
  statusRevoked: { color: '#ef4444', fontSize: 18, fontWeight: 'bold', marginRight: 4 },
  chevron: { color: '#cbd5e1', fontSize: 22 },
  empty: { alignItems: 'center', paddingVertical: 48, marginHorizontal: 16, backgroundColor: 'transparent', borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 15 },
  emptySubtext: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
});
