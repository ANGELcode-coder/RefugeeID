import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, Modal, TextInput, Platform } from 'react-native';
import { useAuth } from '../lib/auth';
import { cache } from '../lib/cache';
import { biometrics } from '../lib/biometrics';
import { usePreferences } from '../lib/theme-context';
import { LANGUAGES, FONT_SIZES, THEME_LABELS, Language, FontSize, ThemeMode } from '../lib/preferences';
import { StatusBar } from 'expo-status-bar';

export function SettingsScreen({ navigation }: any) {
  const { signOut, user } = useAuth();
  const { prefs, isDark, updateTheme, updateFontSize, updateLanguage } = usePreferences();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    biometrics.isAvailable().then(setBiometricAvailable);
    biometrics.isBiometricEnabled().then(setBiometricEnabled);
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleEraseData = () => {
    Alert.alert(
      'Erase All Wallet Data',
      'This will remove all locally stored credentials and sign you out. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase',
          style: 'destructive',
          onPress: async () => {
            try {
              await cache.clearAll();
              await biometrics.clearPin();
              await biometrics.setBiometricEnabled(false);
              await signOut();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to erase data');
            }
          },
        },
      ],
    );
  };

  const toggleBiometric = async () => {
    if (!biometricAvailable) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
      return;
    }

    if (biometricEnabled) {
      await biometrics.setBiometricEnabled(false);
      setBiometricEnabled(false);
    } else {
      const success = await biometrics.authenticate('Enable biometric lock');
      if (success) {
        await biometrics.setBiometricEnabled(true);
        setBiometricEnabled(true);
      }
    }
  };

  const handleSetPin = () => {
    setPinInput('');
    setPinError('');
    setShowPinModal(true);
  };

  const handlePinSubmit = async () => {
    if (pinInput.length !== 6 || !/^\d+$/.test(pinInput)) {
      setPinError('PIN must be exactly 6 digits');
      return;
    }
    await biometrics.setPin(pinInput);
    setShowPinModal(false);
    setPinInput('');
    Alert.alert('Success', 'PIN set successfully.');
  };

  const themed = {
    container: { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
    header: { backgroundColor: isDark ? '#1e293b' : '#fff', borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
    title: { color: isDark ? '#e2e8f0' : '#0f172a' },
    section: { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' },
    sectionTitle: { color: '#94a3b8' },
    menuItem: { borderBottomColor: isDark ? '#334155' : '#f8fafc' },
    menuLabel: { color: isDark ? '#e2e8f0' : '#0f172a' },
    profileCard: { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' },
    email: { color: isDark ? '#e2e8f0' : '#0f172a' },
    signOutButton: { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' },
    modalOverlay: { backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { backgroundColor: isDark ? '#1e293b' : '#fff' },
    modalTitle: { color: isDark ? '#e2e8f0' : '#0f172a' },
    modalInput: { backgroundColor: isDark ? '#0f172a' : '#f1f5f9', color: isDark ? '#e2e8f0' : '#0f172a', borderColor: isDark ? '#334155' : '#e2e8f0' },
    pickerItem: { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
  };

  return (
    <SafeAreaView style={[styles.container, themed.container]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, themed.header]}>
        <Text style={[styles.title, themed.title]}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.profileCard, themed.profileCard]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.email, themed.email]}>{user?.email}</Text>
            <Text style={styles.role}>Holder</Text>
          </View>
        </View>

        <View style={[styles.section, themed.section]}>
          <Text style={[styles.sectionTitle, themed.sectionTitle]}>Appearance</Text>

          <TouchableOpacity style={[styles.menuItem, themed.menuItem]} onPress={() => setShowThemePicker(!showThemePicker)}>
            <Text style={styles.menuIcon}>{'\ud83c\udf19'}</Text>
            <Text style={[styles.menuLabel, themed.menuLabel]}>Dark Mode</Text>
            <Text style={styles.menuValue}>{THEME_LABELS[prefs.theme]}</Text>
          </TouchableOpacity>

          {showThemePicker && (
            <View style={styles.pickerRow}>
              {(Object.keys(THEME_LABELS) as ThemeMode[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pickerItem, themed.pickerItem, prefs.theme === t && styles.pickerItemActive]}
                  onPress={() => { updateTheme(t); setShowThemePicker(false); }}
                >
                  <Text style={[styles.pickerText, prefs.theme === t && styles.pickerTextActive]}>{THEME_LABELS[t]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={[styles.menuItem, themed.menuItem]} onPress={() => setShowFontPicker(!showFontPicker)}>
            <Text style={styles.menuIcon}>{'\ud83d\udd24'}</Text>
            <Text style={[styles.menuLabel, themed.menuLabel]}>Font Size</Text>
            <Text style={styles.menuValue}>{FONT_SIZES[prefs.fontSize]}</Text>
          </TouchableOpacity>

          {showFontPicker && (
            <View style={styles.pickerRow}>
              {(Object.keys(FONT_SIZES) as FontSize[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.pickerItem, themed.pickerItem, prefs.fontSize === f && styles.pickerItemActive]}
                  onPress={() => { updateFontSize(f); setShowFontPicker(false); }}
                >
                  <Text style={[styles.pickerText, prefs.fontSize === f && styles.pickerTextActive]}>{FONT_SIZES[f]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={[styles.menuItem, themed.menuItem]} onPress={() => setShowLangPicker(!showLangPicker)}>
            <Text style={styles.menuIcon}>{'\ud83c\udf10'}</Text>
            <Text style={[styles.menuLabel, themed.menuLabel]}>Language</Text>
            <Text style={styles.menuValue}>{LANGUAGES[prefs.language]}</Text>
          </TouchableOpacity>

          {showLangPicker && (
            <View style={styles.pickerRow}>
              {(Object.keys(LANGUAGES) as Language[]).map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.pickerItem, themed.pickerItem, prefs.language === l && styles.pickerItemActive]}
                  onPress={() => { updateLanguage(l); setShowLangPicker(false); }}
                >
                  <Text style={[styles.pickerText, prefs.language === l && styles.pickerTextActive]}>{LANGUAGES[l]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.section, themed.section]}>
          <Text style={[styles.sectionTitle, themed.sectionTitle]}>Security</Text>

          {biometricAvailable && (
            <TouchableOpacity style={[styles.menuItem, themed.menuItem]} onPress={toggleBiometric}>
              <Text style={styles.menuIcon}>{'\ud83d\udc64'}</Text>
              <Text style={[styles.menuLabel, themed.menuLabel]}>Biometric Lock</Text>
              <Text style={[styles.menuValue, biometricEnabled && styles.menuValueActive]}>
                {biometricEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.menuItem, themed.menuItem]} onPress={handleSetPin}>
            <Text style={styles.menuIcon}>{'\ud83d\udd10'}</Text>
            <Text style={[styles.menuLabel, themed.menuLabel]}>Set PIN</Text>
            <Text style={styles.menuArrow}>{'\u203a'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, themed.menuItem]} onPress={() => navigation.navigate('ShareHistory')}>
            <Text style={styles.menuIcon}>{'\ud83d\udcdd'}</Text>
            <Text style={[styles.menuLabel, themed.menuLabel]}>Share History</Text>
            <Text style={styles.menuArrow}>{'\u203a'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, themed.section]}>
          <Text style={[styles.sectionTitle, themed.sectionTitle]}>Info</Text>

          <TouchableOpacity style={[styles.menuItem, themed.menuItem]} onPress={() => navigation.navigate('About')}>
            <Text style={styles.menuIcon}>{'\u2139\ufe0f'}</Text>
            <Text style={[styles.menuLabel, themed.menuLabel]}>About RefugeeID</Text>
            <Text style={styles.menuArrow}>{'\u203a'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, themed.section]}>
          <Text style={[styles.sectionTitle, themed.sectionTitle]}>Danger Zone</Text>
          <TouchableOpacity style={[styles.menuItem, themed.menuItem]} onPress={handleEraseData}>
            <Text style={styles.menuIcon}>{'\ud83d\uddd1\ufe0f'}</Text>
            <Text style={styles.dangerLabel}>Erase All Wallet Data</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.signOutButton, themed.signOutButton]} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.navigate('About')}>
          <Text style={styles.footer}>RefugeeID Wallet v1.0</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, themed.modalOverlay]}>
          <View style={[styles.modalContent, themed.modalContent]}>
            <Text style={[styles.modalTitle, themed.modalTitle]}>Set PIN</Text>
            <Text style={styles.modalSubtitle}>Enter a 6-digit PIN to secure your wallet</Text>
            <TextInput
              style={[styles.modalInput, themed.modalInput]}
              value={pinInput}
              onChangeText={(text) => { setPinInput(text.replace(/[^0-9]/g, '')); setPinError(''); }}
              placeholder="000000"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
            />
            {pinError ? <Text style={styles.modalError}>{pinError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowPinModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, pinInput.length !== 6 && styles.modalConfirmDisabled]}
                onPress={handlePinSubmit}
                disabled={pinInput.length !== 6}
              >
                <Text style={styles.modalConfirmText}>Set PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  email: { fontSize: 15, fontWeight: '600' },
  role: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  section: { borderRadius: 16, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  menuIcon: { fontSize: 18, marginRight: 12, width: 28 },
  menuLabel: { flex: 1, fontSize: 15 },
  menuValue: { fontSize: 13, color: '#94a3b8' },
  menuValueActive: { color: '#10b981' },
  menuArrow: { fontSize: 18, color: '#cbd5e1' },
  pickerRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  pickerItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  pickerItemActive: { backgroundColor: '#3b82f6' },
  pickerText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  pickerTextActive: { color: '#fff' },
  dangerLabel: { flex: 1, fontSize: 15, color: '#ef4444' },
  signOutButton: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, borderWidth: 1 },
  signOutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  footerBtn: { alignItems: 'center', marginTop: 24, marginBottom: 40 },
  footer: { textAlign: 'center', color: '#cbd5e1', fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { color: '#94a3b8', fontSize: 13, marginBottom: 20, textAlign: 'center' },
  modalInput: { borderRadius: 12, padding: 16, fontSize: 28, fontFamily: 'monospace', letterSpacing: 8, textAlign: 'center', width: '100%', borderWidth: 2, marginBottom: 8 },
  modalError: { color: '#ef4444', fontSize: 13, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  modalCancel: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  modalCancelText: { color: '#64748b', fontSize: 15, fontWeight: '500' },
  modalConfirm: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#3b82f6' },
  modalConfirmDisabled: { opacity: 0.5 },
  modalConfirmText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
