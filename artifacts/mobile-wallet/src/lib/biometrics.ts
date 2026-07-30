import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = '@refugeeid_biometric_enabled';
const PIN_KEY = '@refugeeid_pin';

export const biometrics = {
  async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  },

  async authenticate(promptMessage = 'Verify your identity'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use PIN',
      });
      return result.success;
    } catch {
      return false;
    }
  },

  async isBiometricEnabled(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return val === 'true';
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, String(enabled));
  },

  async getPin(): Promise<string | null> {
    return SecureStore.getItemAsync(PIN_KEY);
  },

  async setPin(pin: string): Promise<void> {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  },

  async clearPin(): Promise<void> {
    await SecureStore.deleteItemAsync(PIN_KEY);
  },

  async hasPin(): Promise<boolean> {
    const pin = await SecureStore.getItemAsync(PIN_KEY);
    return pin !== null;
  },

  async verifyPin(input: string): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    return stored === input;
  },
};
