import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { usePreferences } from '../lib/theme-context';
import { cache, ShareHistoryEntry } from '../lib/cache';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';

const METHOD_ICONS: Record<string, string> = {
  qr: '\ud83d\udd35',
  code: '\ud83d\udd11',
  copy: '\ud83d\udccb',
  share: '\ud83d\udce4',
};

const METHOD_LABELS: Record<string, string> = {
  qr: 'QR Code Shown',
  code: 'Code Shared',
  copy: 'DID Copied',
  share: 'Shared via App',
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export function ShareHistoryScreen({ navigation }: any) {
  const { isDark } = usePreferences();
  const [history, setHistory] = useState<ShareHistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      cache.getShareHistory().then(setHistory);
    }, [])
  );

  const handleClear = () => {
    Alert.alert('Clear History', 'Remove all share history? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await cache.clearShareHistory();
          setHistory([]);
        },
      },
    ]);
  };

  const themed = {
    container: { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
    header: { backgroundColor: isDark ? '#1e293b' : '#fff', borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
    title: { color: isDark ? '#e2e8f0' : '#0f172a' },
    subtitle: { color: '#94a3b8' },
    emptyContainer: { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' },
    emptyText: { color: isDark ? '#94a3b8' : '#64748b' },
    card: { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' },
    cardTitle: { color: isDark ? '#e2e8f0' : '#0f172a' },
    cardSubtitle: { color: '#94a3b8' },
    methodLabel: { color: isDark ? '#94a3b8' : '#64748b' },
    timeLabel: { color: '#94a3b8' },
  };

  const renderItem = ({ item }: { item: ShareHistoryEntry }) => (
    <View style={[styles.card, themed.card]}>
      <View style={styles.cardIcon}>
        <Text style={styles.iconText}>{METHOD_ICONS[item.method] || '\u2022'}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, themed.cardTitle]} numberOfLines={1}>
          {item.credentialName || 'Identity'}
        </Text>
        <Text style={[styles.methodLabel, themed.methodLabel]}>
          {METHOD_LABELS[item.method] || item.method}
        </Text>
      </View>
      <Text style={[styles.timeLabel, themed.timeLabel]}>
        {formatTimeAgo(item.timestamp)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, themed.container]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, themed.header]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, themed.title]}>Share History</Text>
            <Text style={[styles.subtitle, themed.subtitle]}>{history.length} items shared</Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearBtn}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, themed.emptyContainer]}>
            <Text style={styles.emptyIcon}>{'\ud83d\udce4'}</Text>
            <Text style={[styles.emptyTitle, themed.cardTitle]}>No Shares Yet</Text>
            <Text style={[styles.emptyText, themed.emptyText]}>
              When you share your identity or credentials, they'll appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { marginBottom: 8 },
  backBtnText: { color: '#3b82f6', fontSize: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 2 },
  clearBtn: { color: '#ef4444', fontSize: 14, fontWeight: '500', padding: 8 },
  list: { padding: 20, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  methodLabel: { fontSize: 12, marginTop: 2 },
  timeLabel: { fontSize: 12 },
  emptyContainer: {
    borderRadius: 16,
    padding: 40,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
