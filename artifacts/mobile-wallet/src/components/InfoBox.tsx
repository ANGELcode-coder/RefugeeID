import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InfoBoxProps {
  icon: string;
  text: string;
  variant?: 'info' | 'warning';
}

export function InfoBox({ icon, text, variant = 'info' }: InfoBoxProps) {
  const theme = variant === 'info' ? infoTheme : warningTheme;

  return (
    <View style={[styles.container, theme.container]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.text, theme.text]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    gap: 10,
  },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 13, lineHeight: 18 },
});

const infoTheme = StyleSheet.create({
  container: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  text: { color: '#1e40af' },
});

const warningTheme = StyleSheet.create({
  container: { backgroundColor: '#1e293b', borderColor: '#334155' },
  text: { color: '#94a3b8' },
});
