import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
}

export function QrCodeDisplay({ value, size = 200, bgColor = '#ffffff', fgColor = '#0f172a' }: QrCodeDisplayProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <QRCode
        value={value}
        size={size}
        color={fgColor}
        backgroundColor={bgColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
});
