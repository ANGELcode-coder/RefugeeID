import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../lib/auth';
import { cache } from '../lib/cache';
import { IssuedCredential } from '../lib/types';
import { usePreferences } from '../lib/theme-context';
import { scheduleCredentialNotification } from '../lib/notifications';
import { haptics } from '../lib/haptics';
import { CodeInput } from '../components/CodeInput';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { StatusBar } from 'expo-status-bar';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://workspaceapi-server-production-314d.up.railway.app';

export function ClaimScreen({ route, navigation }: any) {
  const { user, session } = useAuth();
  const { isDark } = usePreferences();
  const prefillCode = route.params?.prefillCode || '';
  const [code, setCode] = useState(prefillCode);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'code' | 'face'>('code');
  const [pendingCred, setPendingCred] = useState<any | null>(null);
  const pendingCredRef = React.useRef<any | null>(null);
  const pendingCodeRef = React.useRef('');

  React.useEffect(() => {
    if (prefillCode && prefillCode.length === 8) {
      handleClaimCode();
    }
  }, []);

  React.useEffect(() => {
    const verifyResult = route.params?.verifyResult;
    if (verifyResult === 'match' && pendingCredRef.current) {
      haptics.success();
      completeClaim(pendingCodeRef.current, null);
    } else if (verifyResult === 'no_match' && pendingCredRef.current) {
      haptics.error();
      Alert.alert(
        'Face Verification Failed',
        'Your face does not match the credential. Please contact your issuer for assistance.',
      );
      setPhase('code');
      setPendingCred(null);
      pendingCredRef.current = null;
      setCode('');
    }
  }, [route.params?.verifyResult]);

  const handleClaimCode = async () => {
    if (!code || code.length !== 8) {
      haptics.warning();
      Alert.alert('Invalid code', 'Claim code must be 8 characters');
      return;
    }

    setLoading(true);
    try {
      const token = session?.access_token;
      const verifyRes = await fetch(`${API_URL}/api/credentials/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ claim_code: code.toUpperCase() }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || verifyData.status === 'unknown') {
        haptics.error();
        throw new Error(verifyData.error || 'Code is invalid, already claimed, or has expired.');
      }

      if (verifyData.status === 'revoked') {
        haptics.error();
        throw new Error('This credential has been revoked and cannot be claimed.');
      }

      haptics.medium();
      setPendingCred(verifyData.credential);
      pendingCredRef.current = verifyData.credential;
      pendingCodeRef.current = code.toUpperCase();

      if (verifyData.has_face_embedding) {
        setPhase('face');
      } else {
        await completeClaim(code.toUpperCase(), null);
      }
    } catch (err: any) {
      Alert.alert('Failed to claim', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceVerify = () => {
    navigation.navigate('FaceVerify', {
      credentialId: pendingCred?.id,
    });
  };

  const completeClaim = async (claimCode: string, faceEmbedding: number[] | null) => {
    try {
      const token = session?.access_token;
      const body: any = { claim_code: claimCode, user_id: user?.id };
      if (faceEmbedding) body.face_embedding = faceEmbedding;

      const res = await fetch(`${API_URL}/api/credentials/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim credential');

      haptics.success();
      Alert.alert('Success', 'Credential added to your wallet!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      setCode('');
      setPhase('code');
      setPendingCred(null);
      pendingCredRef.current = null;
    } catch (err: any) {
      Alert.alert('Failed to claim', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{'\u2190'} Back</Text>
          </TouchableOpacity>
        </View>

        {phase === 'code' && (
          <View style={styles.content}>
            <Text style={styles.title}>Claim Credential</Text>
            <Text style={styles.subtitle}>Enter the 8-character claim code provided by your issuer.</Text>

            <CodeInput
              value={code}
              onChangeText={setCode}
              dark
            />

            <View style={{ marginTop: 24 }}>
              <Button
                title={loading ? 'Verifying Code...' : 'Verify Code'}
                onPress={handleClaimCode}
                loading={loading}
                disabled={loading || code.length !== 8}
              />
            </View>
          </View>
        )}

        {phase === 'face' && (
          <View style={styles.content}>
            <Text style={styles.title}>Face Verification</Text>
            <Text style={styles.subtitle}>This credential has a face photo on file. You need to verify your face to complete claiming.</Text>

            <InfoBox
              icon={'\ud83d\udcf7'}
              text="Your face will be compared against the photo taken when this credential was issued."
              variant="warning"
            />

            <Button
              title="Open Camera & Verify Face"
              onPress={handleFaceVerify}
              style={{ backgroundColor: '#10b981' }}
            />

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => {
                setPhase('code');
                setPendingCred(null);
                pendingCredRef.current = null;
                setCode('');
              }}
            >
              <Text style={styles.cancelLinkText}>Cancel and try another code</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  backButton: { padding: 8 },
  backText: { color: '#3b82f6', fontSize: 16 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 32, maxWidth: 300, lineHeight: 20 },
  cancelLink: { marginTop: 16 },
  cancelLinkText: { color: '#64748b', fontSize: 13 },
});
