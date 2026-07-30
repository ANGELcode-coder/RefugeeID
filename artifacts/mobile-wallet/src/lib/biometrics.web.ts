export const biometrics = {
  async isAvailable(): Promise<boolean> { return false; },
  async authenticate(_prompt?: string): Promise<boolean> { return false; },
  async isBiometricEnabled(): Promise<boolean> { return false; },
  async setBiometricEnabled(_enabled: boolean): Promise<void> {},
  async getPin(): Promise<string | null> { return null; },
  async setPin(_pin: string): Promise<void> {},
  async clearPin(): Promise<void> {},
  async hasPin(): Promise<boolean> { return false; },
  async verifyPin(_input: string): Promise<boolean> { return false; },
};
