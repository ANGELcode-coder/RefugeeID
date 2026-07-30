export async function registerForPushNotifications(): Promise<string | null> {
  return null;
}

export async function scheduleCredentialNotification(_name: string) {}
export async function scheduleVerificationNotification(_match: boolean, _name: string) {}
export async function scheduleExpiryNotification(_name: string, _days: number) {}
export function addNotificationListener(_handler: (response: any) => void): any {
  return { remove() {} };
}
