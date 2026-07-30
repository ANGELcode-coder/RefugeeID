import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Linking } from 'react-native';
import { usePreferences } from '../lib/theme-context';
import { StatusBar } from 'expo-status-bar';

type LinkItem = {
  icon: string;
  label: string;
  url: string;
};

const LINKS: LinkItem[] = [
  { icon: '\ud83d\udcdd', label: 'Privacy Policy', url: 'https://refugeeid.org/privacy' },
  { icon: '\ud83d\udcc4', label: 'Terms of Service', url: 'https://refugeeid.org/terms' },
  { icon: '\ud83d\udcde', label: 'Contact Support', url: 'mailto:support@refugeeid.org' },
  { icon: '\ud83c\udf10', label: 'Visit Website', url: 'https://refugeeid.org' },
  { icon: '\ud83d\udcbb', label: 'Report a Bug', url: 'mailto:bugs@refugeeid.org?subject=Bug%20Report' },
];

export function AboutScreen({ navigation }: any) {
  const { isDark } = usePreferences();

  const themed = {
    container: { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
    header: { backgroundColor: isDark ? '#1e293b' : '#fff', borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
    title: { color: isDark ? '#e2e8f0' : '#0f172a' },
    card: { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' },
    appDescription: { color: isDark ? '#94a3b8' : '#64748b' },
    versionLabel: { color: '#94a3b8' },
    versionValue: { color: isDark ? '#e2e8f0' : '#0f172a' },
    linkItem: { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' },
    linkLabel: { color: isDark ? '#e2e8f0' : '#0f172a' },
    sectionTitle: { color: isDark ? '#94a3b8' : '#64748b' },
    creditText: { color: isDark ? '#94a3b8' : '#64748b' },
    creditLink: { color: '#3b82f6' },
    footerText: { color: '#64748b' },
  };

  const version = '1.0.0';
  const buildNumber = '1';

  return (
    <SafeAreaView style={[styles.container, themed.container]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, themed.header]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, themed.title]}>About</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.appSection}>
          <View style={styles.appIconContainer}>
            <View style={styles.appIcon}>
              <Text style={styles.appIconText}>{'\ud83c\uddf5\ud83c\uddf1'}</Text>
            </View>
          </View>
          <Text style={styles.appName}>RefugeeID Wallet</Text>
          <Text style={[styles.appDescription, themed.appDescription]}>
            A secure digital identity wallet for refugees to store, manage, and share verified credentials.
          </Text>

          <View style={[styles.versionCard, themed.card]}>
            <View style={styles.versionRow}>
              <Text style={[styles.versionLabel, themed.versionLabel]}>Version</Text>
              <Text style={[styles.versionValue, themed.versionValue]}>{version}</Text>
            </View>
            <View style={[styles.versionDivider, { backgroundColor: themed.card.borderColor }]} />
            <View style={styles.versionRow}>
              <Text style={[styles.versionLabel, themed.versionLabel]}>Build</Text>
              <Text style={[styles.versionValue, themed.versionValue]}>{buildNumber}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, themed.sectionTitle]}>LINKS</Text>
          {LINKS.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.linkItem, themed.linkItem, index === 0 && styles.linkItemFirst, index === LINKS.length - 1 && styles.linkItemLast]}
              onPress={() => Linking.openURL(link.url)}
            >
              <Text style={styles.linkIcon}>{link.icon}</Text>
              <Text style={[styles.linkLabel, themed.linkLabel]}>{link.label}</Text>
              <Text style={styles.linkArrow}>{'\u203a'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, themed.sectionTitle]}>ACKNOWLEDGMENTS</Text>
          <View style={[styles.creditCard, themed.card]}>
            <Text style={[styles.creditText, themed.creditText]}>
              Built with support from UNHCR and partner NGOs to help refugees maintain control of their digital identity.
            </Text>
            <Text style={[styles.creditText, themed.creditText, { marginTop: 12 }]}>
              Powered by Verifiable Credentials and Decentralized Identity standards.
            </Text>
          </View>
        </View>

        <Text style={[styles.footerText, themed.footerText]}>
          {'\u00a9'} 2024 RefugeeID Project. Open source under MIT License.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { marginBottom: 8 },
  backBtnText: { color: '#3b82f6', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  appSection: { alignItems: 'center', marginBottom: 32 },
  appIconContainer: { marginBottom: 16 },
  appIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: { fontSize: 48 },
  appName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  appDescription: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  versionCard: { width: '100%', borderRadius: 12, padding: 16, borderWidth: 1 },
  versionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  versionLabel: { fontSize: 14 },
  versionValue: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  versionDivider: { height: 1, marginVertical: 10 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderBottomWidth: 0,
    gap: 12,
  },
  linkItemFirst: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  linkItemLast: { borderBottomWidth: 1, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  linkIcon: { fontSize: 18 },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  linkArrow: { fontSize: 18, color: '#cbd5e1' },
  creditCard: { borderRadius: 12, padding: 16, borderWidth: 1 },
  creditText: { fontSize: 14, lineHeight: 20 },
  footerText: { fontSize: 12, textAlign: 'center', marginTop: 16, marginBottom: 32 },
});
