import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return null;
}

export async function scheduleCredentialNotification(credentialName: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Credential Claimed',
      body: `${credentialName} has been added to your wallet.`,
    },
    trigger: null,
  });
}

export async function scheduleVerificationNotification(match: boolean, holderName: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: match ? 'Identity Verified' : 'Verification Failed',
      body: match
        ? `${holderName}'s identity has been verified.`
        : `${holderName}'s face did not match the credential.`,
      ...(match ? {} : { sound: 'error' }),
    },
    trigger: null,
  });
}

export async function scheduleExpiryNotification(credentialName: string, daysLeft: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Credential Expiring Soon',
      body: `${credentialName} expires in ${daysLeft} days.`,
    },
    trigger: null,
  });
}

export function addNotificationListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
