import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Image, Share } from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { cache } from '../lib/cache';
import { IssuedCredential } from '../lib/types';
import { usePreferences } from '../lib/theme-context';
import { QrCodeDisplay } from '../components/QrCodeDisplay';
import { StatusBar } from 'expo-status-bar';

export function CredentialDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const { isDark } = usePreferences();
  const [cred, setCred] = useState<IssuedCredential | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);

  useEffect(() => {
    if (id && user) fetchCredential();
  }, [id, user]);

  const fetchCredential = async () => {
    try {
      const cached = await cache.getCredential(id);
      if (cached) {
        setCred(cached);
      }

      const { data, error } = await supabase
        .from('issued_credentials')
        .select('*')
        .eq('id', id)
        .eq('subject_user_id', user?.id)
        .single();
      if (error) throw error;
      setCred(data);
      await cache.addCredential(data as IssuedCredential);
    } catch (e) {
      // silent - cached data will be shown
    }
  };

  const maskString = (str: string, visibleChars = 2) => {
    if (!str) return '';
    return str.substring(0, visibleChars) + '\u2022'.repeat(Math.max(0, str.length - visibleChars));
  };

  const themed = {
    container: { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
    header: { backgroundColor: isDark ? '#1e293b' : '#fff', borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
    title: { color: isDark ? '#e2e8f0' : '#0f172a' },
    section: { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' },
    sectionLabel: { color: isDark ? '#94a3b8' : '#334155' },
    dataLabel: { color: isDark ? '#64748b' : '#94a3b8' },
    dataValue: { color: isDark ? '#e2e8f0' : '#0f172a' },
    qrContainer: { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
    qrCode: { color: isDark ? '#93c5fd' : '#1d4ed8' },
    divider: { backgroundColor: isDark ? '#334155' : '#f1f5f9' },
    backText: { color: '#3b82f6' },
  };

  if (!cred) {
    return (
      <SafeAreaView style={[styles.container, themed.container]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themed.container]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, themed.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, themed.backText]}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, themed.title]}>Credential Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, cred.status !== 'active' && styles.cardRevoked]}>
          {cred.status !== 'active' && (
            <View style={styles.revokedOverlay}>
              <Text style={styles.revokedStamp}>REVOKED</Text>
            </View>
          )}
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardIssuerLabel}>Issuer</Text>
              <Text style={styles.cardIssuer}>UNHCR</Text>
            </View>
            <Text style={styles.cardIcon}>{'\ud83d\udee1\ufe0f'}</Text>
          </View>
          <Text style={styles.cardName}>{cred.given_name} {cred.family_name}</Text>
          <Text style={styles.cardMeta}>{cred.nationality} {'\u2022'} {cred.gender}</Text>
        </View>

        {cred.face_image_url && (
          <View style={[styles.section, themed.section]}>
            <Text style={[styles.sectionLabel, themed.sectionLabel]}>Identity Photo</Text>
            <View style={styles.facePhotoContainer}>
              <Image source={{ uri: cred.face_image_url }} style={styles.facePhoto} />
              <View style={styles.faceInfo}>
                <Text style={[styles.faceInfoTitle, themed.dataValue]}>Face on File</Text>
                <Text style={styles.faceInfoSub}>Linked at issuance for verification</Text>
                <View style={[styles.statusBadge, cred.face_verification_status === 'verified' ? styles.badgeVerified : styles.badgePending]}>
                  <Text style={styles.badgeText}>
                    {cred.face_verification_status === 'verified' ? '\u2713 Face Verified' : cred.face_verification_status === 'failed' ? '\u2717 Verification Failed' : '\u23f3 Pending Verification'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.section, themed.section]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, themed.sectionLabel]}>Private Data</Text>
            <TouchableOpacity onPress={() => setShowSensitive(!showSensitive)}>
              <Text style={styles.toggleBtn}>{showSensitive ? '\ud83d\ude48 Hide' : '\ud83d\udc41\ufe0f Reveal'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, themed.dataLabel]}>Date of Birth</Text>
            <Text style={[styles.dataValue, themed.dataValue]}>{showSensitive ? cred.date_of_birth : maskString(cred.date_of_birth, 4)}</Text>
          </View>
          <View style={[styles.divider, themed.divider]} />
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, themed.dataLabel]}>Case Number</Text>
            <Text style={[styles.dataValueMono, themed.dataValue]}>{showSensitive ? cred.case_number : maskString(cred.case_number, 3)}</Text>
          </View>
          <View style={[styles.divider, themed.divider]} />
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, themed.dataLabel]}>Arrival Site</Text>
            <Text style={[styles.dataValue, themed.dataValue]}>{showSensitive ? cred.arrival_site : maskString(cred.arrival_site, 3)}</Text>
          </View>
        </View>

        <View style={[styles.section, themed.section]}>
          <Text style={[styles.sectionLabel, themed.sectionLabel]}>Verification QR</Text>
          <View style={styles.qrSection}>
            <QrCodeDisplay value={JSON.stringify({ type: 'credential', vcId: cred.vc_id, did: cred.subject_did })} size={180} />
            <Text style={styles.qrSubtext}>Show this QR code to a verifier</Text>
          </View>
          {cred.claim_code && (
            <View style={[styles.codeContainer, themed.qrContainer]}>
              <Text style={[styles.codeLabel]}>Claim Code</Text>
              <Text style={[styles.codeValue, themed.qrCode]}>{cred.claim_code}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.shareCodeBtn} onPress={() => {
            Share.share({
              message: `My RefugeeID credential code: ${cred.claim_code || cred.vc_id}\nHolder: ${cred.given_name} ${cred.family_name}\nDID: ${cred.subject_did}`,
            });
            cache.addShareHistory({ method: 'share', credentialId: cred.vc_id, credentialName: `${cred.given_name} ${cred.family_name}` });
          }}>
            <Text style={styles.shareCodeBtnText}>{'\ud83d\udce4'} Share Code</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, themed.section]}>
          <Text style={[styles.sectionLabel, themed.sectionLabel]}>DID Information</Text>
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, themed.dataLabel]}>Subject DID</Text>
            <Text style={[styles.dataValueMono, themed.dataValue]} numberOfLines={2}>{cred.subject_did}</Text>
          </View>
          <View style={[styles.divider, themed.divider]} />
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, themed.dataLabel]}>Issuer DID</Text>
            <Text style={[styles.dataValueMono, themed.dataValue]} numberOfLines={2}>{cred.issuer_did}</Text>
          </View>
          <View style={[styles.divider, themed.divider]} />
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, themed.dataLabel]}>VC ID</Text>
            <Text style={[styles.dataValueMono, themed.dataValue]} numberOfLines={2}>{cred.vc_id}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  backText: { fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#1d4ed8', borderRadius: 16, padding: 20, marginBottom: 16, overflow: 'hidden' },
  cardRevoked: { backgroundColor: '#475569' },
  revokedOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  revokedStamp: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 4, transform: [{ rotate: '12deg' }], borderWidth: 2, borderColor: '#fff', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  cardIssuerLabel: { color: '#93c5fd', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  cardIssuer: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 2 },
  cardIcon: { fontSize: 28, opacity: 0.8 },
  cardName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  cardMeta: { color: '#93c5fd', fontSize: 13 },
  section: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  toggleBtn: { color: '#3b82f6', fontSize: 13, fontWeight: '500' },
  dataRow: { paddingVertical: 10 },
  dataLabel: { fontSize: 11, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  dataValue: { fontSize: 15 },
  dataValueMono: { fontSize: 15, fontFamily: 'monospace' },
  divider: { height: 1 },
  facePhotoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  facePhoto: { width: 64, height: 80, borderRadius: 10, backgroundColor: '#e2e8f0' },
  faceInfo: { flex: 1 },
  faceInfoTitle: { fontSize: 14, fontWeight: '600' },
  faceInfoSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  qrContainer: { alignItems: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1 },
  qrSection: { alignItems: 'center', marginBottom: 12 },
  qrSubtext: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  codeContainer: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  codeLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  codeValue: { fontSize: 22, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 4 },
  shareCodeBtn: { backgroundColor: '#eff6ff', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  shareCodeBtnText: { color: '#1d4ed8', fontSize: 14, fontWeight: '600' },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  badgeVerified: { backgroundColor: '#dcfce7' },
  badgePending: { backgroundColor: '#fef9c3' },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
