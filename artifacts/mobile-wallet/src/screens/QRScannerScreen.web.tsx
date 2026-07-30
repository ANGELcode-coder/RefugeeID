import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function QRScannerScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{'\ud83d\udcf7'}</Text>
        <Text style={styles.title}>Camera Not Available</Text>
        <Text style={styles.text}>QR scanning is only available on mobile devices.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { color: '#e2e8f0', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  text: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  backBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  backBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
