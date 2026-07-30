import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { button: ViewStyle; text: string }> = {
  primary: { button: { backgroundColor: '#3b82f6' }, text: '#fff' },
  secondary: { button: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' }, text: '#0f172a' },
  danger: { button: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' }, text: '#ef4444' },
  ghost: { button: { backgroundColor: 'transparent' }, text: '#64748b' },
};

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, v.button, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
