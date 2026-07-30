import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useAuth } from '../lib/auth';
import { cache } from '../lib/cache';
import { IssuedCredential } from '../lib/types';
import { usePreferences } from '../lib/theme-context';
import { CodeInput } from '../components/CodeInput';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { StatusBar } from 'expo-status-bar';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

type RecoveryStep = 'options' | 'code' | 'done';

export function RecoverScreen({ navigation }: any) {
  const { user, session } = useAuth();
  const { isDark } = usePreferences();
  const [step, setStep] = useState<RecoveryStep>('options');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveredName, setRecoveredName] = useState('');

  const handleRecover = async () => {
    if (!code || code.length !== 8) {
      Alert.alert('Invalid code', 'Recovery code must be 8 characters');
      return;
    }

    setLoading(true);
    try {
      const token = session?.access_token;
      const res = await fetch(`${API_URL}/api/credentials/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          claim_code: code.toUpperCase(),
          user_id: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim credential');

      setRecoveredName(data.given_name && data.family_name ? `${data.given_name} ${data.family_name}` : 'Credential');
      setStep('done');
    } catch (err: any) {
      Alert.alert('Recovery Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const themed = {
    container: { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
    header: { backgroundColor: isDark ? '#1e293b' : '#fff', borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
    title: { color: isDark ? '#e2e8f0' : '#0f172a' },
    subtitle: { color: '#94a3b8' },
    optionItem: { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' },
    optionLabel: { color: isDark ? '#e2e8f0' : '#0f172a' },
    optionDesc: { color: '#94a3b8' },
    stepTitle: { color: isDark ? '#e2e8f0' : '#0f172a' },
    stepSubtitle: { color: '#94a3b8' },
  };

  return (
    <SafeAreaView style={[styles.container, themed.container]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, themed.header]}>
        {step !== 'options' && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('options')}>
            <Text style={styles.backBtnText}>{'\u2190'} Back</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, themed.title]}>Recover ID</Text>
        <Text style={[styles.subtitle, themed.subtitle]}>
          {step === 'options' && 'Recover a credential using a claim code'}
          {step === 'code' && 'Enter the 8-character claim code'}
          {step === 'done' && 'Credential recovered successfully'}
        </Text>
      </View>

      {step === 'options' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          <InfoBox
            icon={'\ud83d\udca1'}
            text="Your credentials are tied to your account. Simply signing back in will restore all previously claimed credentials to this device."
            variant="info"
          />

          <TouchableOpacity
            style={[styles.optionItem, themed.optionItem]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.optionIcon}>{'\ud83c\udfe0'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, themed.optionLabel]}>Automatic Recovery</Text>
              <Text style={[styles.optionDesc, themed.optionDesc]}>Sign in to restore your credentials automatically</Text>
            </View>
            <Text style={styles.optionArrow}>{'\u203a'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionItem, themed.optionItem, { marginTop: 12 }]}
            onPress={() => setStep('code')}
          >
            <Text style={styles.optionIcon}>{'\ud83d\udd11'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, themed.optionLabel]}>Recover with Claim Code</Text>
              <Text style={[styles.optionDesc, themed.optionDesc]}>Use an 8-character code from your issuer</Text>
            </View>
            <Text style={styles.optionArrow}>{'\u203a'}</Text>
          </TouchableOpacity>

          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>NEED HELP?</Text>
            <TouchableOpacity style={[styles.optionItem, themed.optionItem]} onPress={() => Linking.openURL('mailto:support@refugeeid.org?subject=Credential%20Recovery%20Assistance')}>
              <Text style={styles.optionIcon}>{'\ud83d\udce7'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, themed.optionLabel]}>Contact Issuer</Text>
                <Text style={[styles.optionDesc, themed.optionDesc]}>Reach out to UNHCR or your NGO contact</Text>
              </View>
              <Text style={styles.optionArrow}>{'\u203a'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {step === 'code' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          <InfoBox
            icon={'\u2139\ufe0f'}
            text="If you lost access to your credentials, you can recover them using a claim code from your issuer."
            variant="info"
          />

          <CodeInput
            value={code}
            onChangeText={setCode}
            dark={isDark}
          />

          <View style={{ marginTop: 16 }}>
            <Button
              title={loading ? 'Recovering...' : 'Recover Credential'}
              onPress={handleRecover}
              loading={loading}
              disabled={loading || code.length !== 8}
            />
          </View>
        </KeyboardAvoidingView>
      )}

      {step === 'done' && (
        <View style={styles.content}>
          <View style={styles.doneContainer}>
            <View style={styles.doneIcon}>
              <Text style={styles.doneIconText}>{'\u2713'}</Text>
            </View>
            <Text style={[styles.doneTitle, themed.stepTitle]}>Credential Recovered!</Text>
            {recoveredName ? (
              <Text style={[styles.doneSubtitle, themed.stepSubtitle]}>
                {recoveredName} has been added to your wallet.
              </Text>
            ) : null}

            <View style={{ width: '100%', marginTop: 32 }}>
              <Button
                title="Go to My Wallet"
                onPress={() => navigation.navigate('Home')}
              />
            </View>

            <TouchableOpacity style={{ marginTop: 16 }} onPress={() => { setStep('options'); setCode(''); }}>
              <Text style={styles.doneLink}>Recover Another Credential</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { marginBottom: 8 },
  backBtnText: { color: '#3b82f6', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 4 },
  content: { flex: 1, padding: 20 },
  optionItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, borderWidth: 1, gap: 12 },
  optionIcon: { fontSize: 20 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionDesc: { fontSize: 12, marginTop: 2 },
  optionArrow: { fontSize: 18, color: '#cbd5e1' },
  contactSection: { marginTop: 32 },
  contactTitle: { fontSize: 12, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  doneIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  doneIconText: { fontSize: 36, color: '#16a34a', fontWeight: 'bold' },
  doneTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  doneSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  doneLink: { color: '#3b82f6', fontSize: 14, fontWeight: '500' },
});
