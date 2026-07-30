import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { usePreferences } from '../lib/theme-context';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: '\ud83c\udf0d',
    title: 'Welcome to RefugeeID',
    subtitle: 'Your secure digital identity wallet',
    description: 'RefugeeID helps you store and share your credentials safely, so you can prove who you are wherever you go.',
  },
  {
    icon: '\ud83d\udcbc',
    title: 'Your Digital Wallet',
    subtitle: 'Keep your credentials in one place',
    description: 'All your verified credentials \u2014 identity, vaccination, education \u2014 stored securely on your device and accessible offline.',
  },
  {
    icon: '\ud83d\udd12',
    title: 'Privacy First',
    subtitle: 'You control what you share',
    description: 'Your data stays on your device. Share only what you choose, when you choose, with a simple QR code or verification code.',
  },
  {
    icon: '\ud83d\udee1\ufe0f',
    title: 'Biometric Security',
    subtitle: 'Protect your wallet',
    description: 'Lock your wallet with Face ID or fingerprint. Your credentials are safe even if someone else gets your phone.',
  },
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { isDark } = usePreferences();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentStep(index);
  };

  const themed = {
    container: { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
    skipBtn: { color: isDark ? '#94a3b8' : '#64748b' },
    card: { backgroundColor: isDark ? '#1e293b' : '#fff' },
    title: { color: isDark ? '#e2e8f0' : '#0f172a' },
    subtitle: { color: '#3b82f6' },
    description: { color: isDark ? '#94a3b8' : '#64748b' },
    dot: { backgroundColor: isDark ? '#334155' : '#e2e8f0' },
    dotActive: { backgroundColor: '#3b82f6' },
  };

  return (
    <SafeAreaView style={[styles.container, themed.container]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipBtn, themed.skipBtn]}>
            {currentStep < STEPS.length - 1 ? 'Skip' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.scrollView}
      >
        {STEPS.map((step, index) => (
          <View key={index} style={[styles.stepContainer, { width }]}>
            <View style={styles.illustration}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
            </View>
            <View style={[styles.card, themed.card]}>
              <Text style={[styles.stepTitle, themed.title]}>{step.title}</Text>
              <Text style={[styles.stepSubtitle, themed.subtitle]}>{step.subtitle}</Text>
              <Text style={[styles.stepDescription, themed.description]}>{step.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: themed.dot.backgroundColor },
                index === currentStep && { backgroundColor: themed.dotActive.backgroundColor, width: 24 },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, currentStep === STEPS.length - 1 && styles.getStartedBtn]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  skipBtn: { fontSize: 16, fontWeight: '500', padding: 8 },
  scrollView: { flex: 1 },
  stepContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  illustration: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepIcon: { fontSize: 72 },
  card: {
    borderRadius: 24,
    padding: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  stepTitle: { fontSize: 26, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  stepSubtitle: { fontSize: 16, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  stepDescription: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  footer: { paddingHorizontal: 32, paddingBottom: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  nextBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  getStartedBtn: { backgroundColor: '#16a34a' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
