import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';
import { useAuth } from '../lib/auth';
import { usePreferences } from '../lib/theme-context';
import { haptics } from '../lib/haptics';
import { StatusBar } from 'expo-status-bar';

function LabeledInput({ label, value, onChange, placeholder, secureTextEntry, keyboardType, isDark, onSubmit }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#64748b' }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#f1f5f9' : '#0f172a' }]}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        returnKeyType={secureTextEntry ? 'done' : 'next'}
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}

function SocialButton({ icon, label, isDark }: { icon: string; label: string; isDark: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.socialBtn, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}
      activeOpacity={0.7}
    >
      <Text style={styles.socialIcon}>{icon}</Text>
      <Text style={[styles.socialLabel, { color: isDark ? '#e2e8f0' : '#475569' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Divider({ text, isDark }: { text: string; isDark: boolean }) {
  return (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
      <Text style={[styles.dividerText, { color: isDark ? '#64748b' : '#94a3b8' }]}>{text}</Text>
      <View style={[styles.dividerLine, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
    </View>
  );
}

function AuthCard({ title, subtitle, children, isDark }: { title: string; subtitle: string; children: React.ReactNode; isDark: boolean }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
        <Text style={[styles.cardTitle, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{subtitle}</Text>
        {children}
      </View>
    </Animated.View>
  );
}

export function SignInScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const { isDark } = usePreferences();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      haptics.warning();
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.error) {
        haptics.error();
        setError(result.error);
      } else {
        haptics.success();
      }
    } catch (err: any) {
      haptics.error();
      setError(err?.message || 'Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.logoArea}>
          <Text style={styles.shield}>{'\ud83d\udee1\ufe0f'}</Text>
          <Text style={[styles.brand, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>RefugeeID</Text>
        </View>

        <AuthCard title="Welcome Back" subtitle="Sign in to continue to your account" isDark={isDark}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: isDark ? '#451a1a' : '#fef2f2', borderColor: isDark ? '#ef4444' : '#fecaca' }]}>
              <Text style={[styles.errorText, { color: isDark ? '#fca5a5' : '#dc2626' }]}>{error}</Text>
            </View>
          ) : null}

          <LabeledInput
            label="Email Address"
            value={email}
            onChange={(t: string) => { setEmail(t); setError(''); }}
            placeholder="you@example.com"
            keyboardType="email-address"
            isDark={isDark}
            onSubmit={() => passwordRef.current?.focus()}
          />

          <View style={styles.passwordHeader}>
            <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#64748b' }]}>Password</Text>
            <TouchableOpacity>
              <Text style={styles.forgotLink}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            ref={passwordRef}
            style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#f1f5f9' : '#0f172a' }]}
            placeholder="Enter your password"
            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <Divider text="OR CONTINUE WITH" isDark={isDark} />

          <View style={styles.socialRow}>
            <SocialButton icon="\u2328" label="Google" isDark={isDark} />
            <SocialButton icon="\u25C9" label="Apple" isDark={isDark} />
          </View>
        </AuthCard>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? '#94a3b8' : '#64748b' }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.footerLink}>Create one</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function SignUpScreen({ navigation }: any) {
  const { signUp } = useAuth();
  const { isDark } = usePreferences();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const handleSignUp = async () => {
    if (!email || !password) {
      haptics.warning();
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await signUp(email, password);
      if (result.error) {
        haptics.error();
        setError(result.error);
      } else {
        haptics.success();
        setSuccess('Account created! Redirecting...');
        setTimeout(() => navigation.goBack(), 1500);
      }
    } catch (err: any) {
      haptics.error();
      setError(err?.message || 'Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.logoArea}>
          <Text style={styles.shield}>{'\ud83d\udee1\ufe0f'}</Text>
          <Text style={[styles.brand, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>RefugeeID</Text>
        </View>

        <AuthCard title="Create Account" subtitle="Join RefugeeID to secure your identity" isDark={isDark}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: isDark ? '#451a1a' : '#fef2f2', borderColor: isDark ? '#ef4444' : '#fecaca' }]}>
              <Text style={[styles.errorText, { color: isDark ? '#fca5a5' : '#dc2626' }]}>{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View style={[styles.successBox, { backgroundColor: isDark ? '#14532d' : '#f0fdf4', borderColor: isDark ? '#22c55e' : '#bbf7d0' }]}>
              <Text style={[styles.successText, { color: isDark ? '#86efac' : '#16a34a' }]}>{success}</Text>
            </View>
          ) : null}

          <LabeledInput label="Email Address" value={email} onChange={(t: string) => { setEmail(t); setError(''); }} placeholder="you@example.com" keyboardType="email-address" isDark={isDark} onSubmit={() => passwordRef.current?.focus()} />
          <LabeledInput label="Password" value={password} onChange={(t: string) => { setPassword(t); setError(''); }} placeholder="Min. 6 characters" secureTextEntry isDark={isDark} onSubmit={handleSignUp} />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </AuthCard>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? '#94a3b8' : '#64748b' }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  shield: {
    fontSize: 36,
    marginBottom: 8,
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  cardContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    gap: 20,
    // shadow
    ...Platform.select({
      web: {
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
      },
    }),
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: -12,
    lineHeight: 20,
  },

  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    outlineStyle: 'none',
    outlineWidth: 0,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },

  primaryBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  socialIcon: {
    fontSize: 18,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },

  errorBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  successBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  successText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
