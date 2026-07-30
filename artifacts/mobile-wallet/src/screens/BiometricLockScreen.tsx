import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { biometrics } from '../lib/biometrics';
import { haptics } from '../lib/haptics';

interface BiometricLockScreenProps {
  onUnlock: () => void;
}

export function BiometricLockScreen({ onUnlock }: BiometricLockScreenProps) {
  const [mode, setMode] = useState<'biometric' | 'pin'>('biometric');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleBiometricUnlock = async () => {
    const success = await biometrics.authenticate('Unlock RefugeeID Wallet');
    if (success) {
      haptics.success();
      onUnlock();
    } else {
      haptics.error();
    }
  };

  const handlePinUnlock = async () => {
    if (pin.length !== 6) {
      haptics.warning();
      setPinError('PIN must be 6 digits');
      return;
    }
    const valid = await biometrics.verifyPin(pin);
    if (valid) {
      haptics.success();
      onUnlock();
    } else {
      haptics.error();
      setPinError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.content}>
          <View style={styles.lockIcon}>
            <Text style={styles.lockEmoji}>{mode === 'biometric' ? '\ud83d\udd10' : '\ud83d\udd11'}</Text>
          </View>

          <Text style={styles.title}>RefugeeID Wallet</Text>
          <Text style={styles.subtitle}>Authenticate to continue</Text>

          {mode === 'biometric' ? (
            <TouchableOpacity style={styles.authButton} onPress={handleBiometricUnlock}>
              <Text style={styles.authButtonText}>Authenticate with Biometrics</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.pinSection}>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={(text) => { setPin(text.replace(/[^0-9]/g, '')); setPinError(''); }}
                placeholder="000000"
                placeholderTextColor="#475569"
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
              />
              {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
              <TouchableOpacity
                style={[styles.authButton, pin.length !== 6 && styles.authButtonDisabled]}
                onPress={handlePinUnlock}
                disabled={pin.length !== 6}
              >
                <Text style={styles.authButtonText}>Unlock</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.switchLink}
            onPress={() => setMode(mode === 'biometric' ? 'pin' : 'biometric')}
          >
            <Text style={styles.switchText}>
              {mode === 'biometric' ? 'Use PIN instead' : 'Use biometrics instead'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  lockIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#334155' },
  lockEmoji: { fontSize: 36 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 14, marginBottom: 40 },
  authButton: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  authButtonDisabled: { opacity: 0.5 },
  authButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pinSection: { width: '100%', alignItems: 'center' },
  pinInput: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, fontSize: 28, fontFamily: 'monospace', letterSpacing: 8, color: '#fff', textAlign: 'center', width: '100%', borderWidth: 2, borderColor: '#334155', marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 13, marginBottom: 8 },
  switchLink: { marginTop: 24 },
  switchText: { color: '#3b82f6', fontSize: 14 },
});
