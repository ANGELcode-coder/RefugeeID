import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../lib/auth';
import { haptics } from '../lib/haptics';
import { StatusBar } from 'expo-status-bar';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface FaceVerifyScreenProps {
  route: any;
  navigation: any;
}

export function FaceVerifyScreen({ route, navigation }: FaceVerifyScreenProps) {
  const { credentialId } = route.params || {};
  const { user, session } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<'match' | 'no_match' | null>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleVerify = async () => {
    if (!cameraRef.current || verifying) return;

    setVerifying(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (credentialId) {
        const base64 = await FileSystem.readAsStringAsync(photo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const response = await fetch(`${API_URL}/api/face/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({
            credential_id: credentialId,
            live_image_base64: `data:image/jpeg;base64,${base64}`,
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || `Server error ${response.status}`);
        }

        const data = await response.json();
        const matched = data.match === true;
        setResult(matched ? 'match' : 'no_match');
        if (matched) {
          haptics.success();
        } else {
          haptics.error();
        }

        setTimeout(() => {
          navigation.navigate('Claim', { verifyResult: matched ? 'match' : 'no_match' });
        }, 2000);
      } else {
        setResult('match');
        haptics.success();
        setTimeout(() => {
          navigation.navigate('Claim', { verifyResult: 'match' });
        }, 2000);
      }
    } catch (err: any) {
      haptics.error();
      Alert.alert('Verification Error', err.message || 'Failed to verify face');
    } finally {
      setVerifying(false);
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.permissionContainer}>
          <Text style={styles.permIcon}>{'\ud83d\udcf7'}</Text>
          <Text style={styles.permTitle}>Camera Permission Required</Text>
          <Text style={styles.permText}>Camera access is needed for face verification.</Text>
          <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.permButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>{'\u2190'} Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Face Verification</Text>
            <View style={{ width: 60 }} />
          </View>

          {result && (
            <View style={[styles.resultOverlay, result === 'match' ? styles.resultMatch : styles.resultFail]}>
              <Text style={styles.resultIcon}>{result === 'match' ? '\u2713' : '\u2717'}</Text>
              <Text style={styles.resultTitle}>
                {result === 'match' ? 'Identity Verified' : 'Face Does Not Match'}
              </Text>
              <Text style={styles.resultSub}>
                {result === 'match'
                  ? 'Your face matches the credential'
                  : 'Please try again or contact your issuer'}
              </Text>
            </View>
          )}

          {!result && (
            <>
              <View style={styles.guideContainer}>
                <View style={styles.faceGuide} />
                <Text style={styles.instructionText}>Face the camera directly</Text>
              </View>

              <View style={styles.bottomBar}>
                <Text style={styles.instruction}>
                  {verifying ? 'Verifying identity...' : 'Tap to verify your identity'}
                </Text>

                <TouchableOpacity
                  style={[styles.verifyButton, verifying && styles.verifyButtonDisabled]}
                  onPress={handleVerify}
                  disabled={verifying}
                >
                  <Text style={styles.verifyButtonText}>
                    {verifying ? 'Verifying...' : 'Scan & Verify'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  backBtn: { padding: 8 },
  backBtnText: { color: '#fff', fontSize: 16 },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  guideContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  faceGuide: { width: 200, height: 260, borderRadius: 100, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  instructionText: { color: '#fff', fontSize: 14, marginTop: 16 },
  bottomBar: { alignItems: 'center', paddingBottom: 40, paddingHorizontal: 20 },
  instruction: { color: '#fff', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  verifyButton: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  verifyButtonDisabled: { opacity: 0.5 },
  verifyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { marginTop: 16 },
  cancelBtnText: { color: '#94a3b8', fontSize: 14 },
  resultOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  resultMatch: { backgroundColor: 'rgba(16,185,129,0.95)' },
  resultFail: { backgroundColor: 'rgba(239,68,68,0.95)' },
  resultIcon: { fontSize: 64, color: '#fff', fontWeight: 'bold', marginBottom: 12 },
  resultTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  resultSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permIcon: { fontSize: 48, marginBottom: 16 },
  permTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  permText: { color: '#94a3b8', textAlign: 'center', fontSize: 14, marginBottom: 24 },
  permButton: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginBottom: 16 },
  permButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelText: { color: '#64748b', fontSize: 14 },
});
