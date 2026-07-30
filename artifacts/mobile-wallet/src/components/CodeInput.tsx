import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

interface CodeInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  maxLength?: number;
  dark?: boolean;
}

export function CodeInput({ value, onChangeText, maxLength = 8, dark = false, ...rest }: CodeInputProps) {
  const theme = dark ? darkTheme : lightTheme;

  return (
    <TextInput
      style={[styles.input, theme.input]}
      value={value}
      onChangeText={(text) => onChangeText(text.toUpperCase())}
      placeholder="A1B2C3D4"
      placeholderTextColor={dark ? '#475569' : '#94a3b8'}
      maxLength={maxLength}
      autoCapitalize="characters"
      autoCorrect={false}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 16,
    padding: 20,
    fontSize: 28,
    fontFamily: 'monospace',
    letterSpacing: 8,
    textAlign: 'center',
    borderWidth: 2,
    width: '100%',
  },
});

const lightTheme = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    color: '#0f172a',
    borderColor: '#e2e8f0',
  },
});

const darkTheme = StyleSheet.create({
  input: {
    backgroundColor: '#1e293b',
    color: '#fff',
    borderColor: '#334155',
  },
});
