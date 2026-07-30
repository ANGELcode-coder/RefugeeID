import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  CredentialDetail: { id: string };
  FaceCapture: { onResult?: (result: { imageUrl: string; detected: boolean }) => void; mode?: 'capture' | 'verify' };
  FaceVerify: { credentialId?: string };
  Claim: { prefillCode?: string; verifyResult?: 'match' | 'no_match' };
  QRScanner: undefined;
  BiometricLock: undefined;
  About: undefined;
  ShareHistory: undefined;
};

export type TabParamList = {
  Home: { scanResult?: string } | undefined;
  Recover: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
