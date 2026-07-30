import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export function FaceCaptureScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{'\ud83d\udcf7'}</Text>
        <Text style={styles.title}>Camera Not Available</Text>
        <Text style={styles.text}>Face capture is only available on mobile devices.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { color: '#e2e8f0', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  text: { color: '#94a3b8', fontSize: 14, textAlign: 'center' },
});
