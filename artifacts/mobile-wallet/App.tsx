import React, { useEffect, useState, lazy, Suspense } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/lib/auth';
import { PreferencesProvider, usePreferences } from './src/lib/theme-context';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { RootStackParamList, TabParamList } from './src/lib/navigation';
import { preferences } from './src/lib/preferences';
import { cache } from './src/lib/cache';
import { supabase } from './src/lib/supabase';
import { IssuedCredential } from './src/lib/types';
import * as Linking from 'expo-linking';

import { SignInScreen, SignUpScreen } from './src/screens/AuthScreens';

const WalletHomeScreen = lazy(() => import('./src/screens/WalletHomeScreen').then(m => ({ default: m.WalletHomeScreen })));
const SettingsScreen = lazy(() => import('./src/screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const RecoverScreen = lazy(() => import('./src/screens/RecoverScreen').then(m => ({ default: m.RecoverScreen })));

const CredentialDetailScreen = lazy(() => import('./src/screens/CredentialDetailScreen').then(m => ({ default: m.CredentialDetailScreen })));
const FaceCaptureScreen = lazy(() => import('./src/screens/FaceCaptureScreen').then(m => ({ default: m.FaceCaptureScreen })));
const FaceVerifyScreen = lazy(() => import('./src/screens/FaceVerifyScreen').then(m => ({ default: m.FaceVerifyScreen })));
const ClaimScreen = lazy(() => import('./src/screens/ClaimScreen').then(m => ({ default: m.ClaimScreen })));
const QRScannerScreen = lazy(() => import('./src/screens/QRScannerScreen').then(m => ({ default: m.QRScannerScreen })));
const AboutScreen = lazy(() => import('./src/screens/AboutScreen').then(m => ({ default: m.AboutScreen })));
const ShareHistoryScreen = lazy(() => import('./src/screens/ShareHistoryScreen').then(m => ({ default: m.ShareHistoryScreen })));
const OnboardingScreen = lazy(() => import('./src/screens/OnboardingScreen').then(m => ({ default: m.OnboardingScreen })));
const BiometricLockScreen = lazy(() => import('./src/screens/BiometricLockScreen').then(m => ({ default: m.BiometricLockScreen })));

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'refugeeid://'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: 'wallet',
          Recover: 'recover',
        },
      },
      Claim: 'claim/:code',
      CredentialDetail: 'credential/:id',
    },
  },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '\ud83c\udfe0', Recover: '\ud83d\udd04', Settings: '\u2699\ufe0f' };
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{icons[name] || '\u2022'}</Text>
    </View>
  );
}

function WalletTabs() {
  const { isDark } = usePreferences();
  return (
    <Suspense fallback={<ActivityIndicator size="large" color="#3b82f6" style={{ flex: 1 }} />}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: isDark ? '#1e293b' : '#fff',
            borderTopColor: isDark ? '#334155' : '#e2e8f0',
            paddingBottom: 8,
            paddingTop: 8,
            height: 64,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={WalletHomeScreen} />
        <Tab.Screen name="Recover" component={RecoverScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </Suspense>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function LazyScreen({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<ActivityIndicator size="large" color="#3b82f6" style={{ flex: 1 }} />}>{children}</Suspense>;
}

function WalletStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={WalletTabs} />
      <Stack.Screen name="CredentialDetail">
        {(props) => <LazyScreen><CredentialDetailScreen {...props} /></LazyScreen>}
      </Stack.Screen>
      <Stack.Screen name="FaceCapture">
        {(props) => <LazyScreen><FaceCaptureScreen {...props} /></LazyScreen>}
      </Stack.Screen>
      <Stack.Screen name="FaceVerify">
        {(props) => <LazyScreen><FaceVerifyScreen {...props} /></LazyScreen>}
      </Stack.Screen>
      <Stack.Screen name="Claim">
        {(props) => <LazyScreen><ClaimScreen {...props} /></LazyScreen>}
      </Stack.Screen>
      <Stack.Screen name="QRScanner">
        {(props) => <LazyScreen><QRScannerScreen {...props} /></LazyScreen>}
      </Stack.Screen>
      <Stack.Screen name="About">
        {(props) => <LazyScreen><AboutScreen {...props} /></LazyScreen>}
      </Stack.Screen>
      <Stack.Screen name="ShareHistory">
        {(props) => <LazyScreen><ShareHistoryScreen {...props} /></LazyScreen>}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function SyncCredentials({ userId }: { userId: string }) {
  useEffect(() => {
    let mounted = true;

    async function sync() {
      try {
        const { data } = await supabase
          .from('issued_credentials')
          .select('*')
          .eq('subject_user_id', userId)
          .order('claimed_at', { ascending: false });

        if (mounted && data) {
          await cache.setCredentials(data as IssuedCredential[]);
        }
      } catch {}
    }

    const timer = setTimeout(sync, 2000);
    const interval = setInterval(sync, 5 * 60 * 1000);
    return () => { mounted = false; clearTimeout(timer); clearInterval(interval); };
  }, [userId]);

  return null;
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const { isDark } = usePreferences();
  const [biometricLocked, setBiometricLocked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const fallback = setTimeout(() => {
      if (!cancelled) setOnboardingComplete(false);
    }, 2000);
    preferences.get().then(p => {
      clearTimeout(fallback);
      if (!cancelled) setOnboardingComplete(p.hasCompletedOnboarding);
    }).catch(() => {
      clearTimeout(fallback);
      if (!cancelled) setOnboardingComplete(false);
    });
    return () => { cancelled = true; clearTimeout(fallback); };
  }, [user]);

  if (loading || (user && onboardingComplete === null)) {
    return (
      <View style={[styles.loading, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>Loading RefugeeID...</Text>
      </View>
    );
  }

  if (user && !onboardingComplete) {
    return (
      <LazyScreen>
        <OnboardingScreen
          onComplete={async () => {
            await preferences.completeOnboarding();
            setOnboardingComplete(true);
          }}
        />
      </LazyScreen>
    );
  }

  if (!user) return <AuthStack />;

  if (biometricLocked) {
    return (
      <LazyScreen>
        <BiometricLockScreen onUnlock={() => setBiometricLocked(false)} />
      </LazyScreen>
    );
  }

  return (
    <>
      <SyncCredentials userId={user.id} />
      <WalletStack />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <NavigationContainer linking={linking}>
          <RootNavigator />
        </NavigationContainer>
      </PreferencesProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  tabIcon: { alignItems: 'center', justifyContent: 'center' },
  tabEmoji: { fontSize: 20 },
  tabEmojiActive: { fontSize: 22 },
});
