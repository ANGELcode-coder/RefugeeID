import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

interface FaceCaptureScreenProps {
  route: any;
  navigation: any;
}

export function FaceCaptureScreen({ route, navigation }: FaceCaptureScreenProps) {
  const { onResult, mode } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current || processing) return;

    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      setCapturedImage(photo.uri);
    } catch (err: any) {
      Alert.alert('Capture Error', err.message || 'Failed to take photo');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (onResult && capturedImage) {
      onResult({ imageUrl: capturedImage, detected: true });
    }
    navigation.goBack();
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.permissionContainer}>
          <Text style={styles.permIcon}>{'\ud83d\udcf7'}</Text>
          <Text style={styles.permTitle}>Camera Permission Required</Text>
          <Text style={styles.permText}>Camera access is needed for face capture.</Text>
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

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <Image source={{ uri: capturedImage }} style={styles.preview} />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeBtn} onPress={() => setCapturedImage(null)}>
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.useBtn} onPress={handleConfirm}>
            <Text style={styles.useBtnText}>Use Photo</Text>
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
            <Text style={styles.title}>
              {mode === 'verify' ? 'Verify Face' : 'Capture Face'}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.guideContainer}>
            <View style={styles.faceGuide} />
            <Text style={styles.instructionText}>
              Center your face in the circle
            </Text>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              disabled={processing}
            >
              <Text style={styles.captureButtonText}>
                {processing ? 'Processing...' : 'Capture'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  captureButton: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  captureButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { marginTop: 16 },
  cancelBtnText: { color: '#94a3b8', fontSize: 14 },
  preview: { flex: 1, resizeMode: 'contain' },
  previewActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 40 },
  retakeBtn: { flex: 1, backgroundColor: '#334155', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  retakeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  useBtn: { flex: 1, backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  useBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permIcon: { fontSize: 48, marginBottom: 16 },
  permTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  permText: { color: '#94a3b8', textAlign: 'center', fontSize: 14, marginBottom: 24 },
  permButton: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginBottom: 16 },
  permButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelText: { color: '#64748b', fontSize: 14 },
});
