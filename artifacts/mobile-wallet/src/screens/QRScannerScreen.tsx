import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

interface QRScannerScreenProps {
  route: any;
  navigation: any;
}

export function QRScannerScreen({ route, navigation }: QRScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarcodeScanned = (result: any) => {
    if (scanned) return;
    setScanned(true);

    const data = result.data || result.raw;
    navigation.navigate('Home', { scanResult: data });
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.permissionContainer}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Camera Permission Required</Text>
          <Text style={styles.permText}>Camera access is needed to scan QR codes.</Text>
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
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Scan QR Code</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.guideContainer}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>

          <View style={styles.bottomBar}>
            <Text style={styles.instruction}>
              Point camera at a QR code to scan
            </Text>
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
  scanFrame: { width: 250, height: 250, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#10b981' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  bottomBar: { alignItems: 'center', paddingBottom: 40, paddingHorizontal: 20 },
  instruction: { color: '#fff', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  cancelBtn: { padding: 8 },
  cancelBtnText: { color: '#94a3b8', fontSize: 14 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permIcon: { fontSize: 48, marginBottom: 16 },
  permTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  permText: { color: '#94a3b8', textAlign: 'center', fontSize: 14, marginBottom: 24 },
  permButton: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginBottom: 16 },
  permButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelText: { color: '#64748b', fontSize: 14 },
});
