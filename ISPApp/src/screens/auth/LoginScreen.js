// ISP Management System - Login Screen
// Deep Blue + Slate palette — Enterprise grade
// Reference: .agent/skills/design-tokens.md, screen-template.md

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../stores/auth.store';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  // ── State ────────────────────────────────────────────
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const { login, isLoading, error, clearError } = useAuthStore();

  // ── Animations ───────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Handlers ─────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    if (!username.trim() || !password.trim()) return;

    // Button press feedback
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    clearError();
    await login(username.trim(), password);
  }, [username, password, login, clearError, buttonScale]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);

  const handleFieldChange = useCallback((setter) => (text) => {
    setter(text);
    if (error) clearError();
  }, [error, clearError]);

  // ── Render ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[900]} />

      <LinearGradient
        colors={[colors.primary[800], colors.primary[900], '#0F1D42']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Subtle decorative elements */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}>
              {/* Header */}
              <View style={styles.headerContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="globe-outline" size={40} color={colors.primary[600]} />
                </View>
                <Text style={styles.appName}>MBA NET</Text>
                <Text style={styles.tagline}>ISP Management System</Text>
              </View>

              {/* Login Card */}
              <View style={styles.card}>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.subtitleText}>Sign in to continue</Text>

                {/* Error */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={colors.semantic.errorDark} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Username */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <View style={[
                    styles.inputContainer,
                    focusedField === 'username' && styles.inputFocused,
                  ]}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={focusedField === 'username' ? colors.primary[500] : colors.neutral[400]}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your username"
                      placeholderTextColor={colors.neutral[300]}
                      value={username}
                      onChangeText={handleFieldChange(setUsername)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      testID="login-username-input"
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[
                    styles.inputContainer,
                    focusedField === 'password' && styles.inputFocused,
                  ]}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={focusedField === 'password' ? colors.primary[500] : colors.neutral[400]}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.neutral[300]}
                      value={password}
                      onChangeText={handleFieldChange(setPassword)}
                      secureTextEntry={!isPasswordVisible}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      testID="login-password-input"
                    />
                    <TouchableOpacity
                      onPress={togglePasswordVisibility}
                      style={styles.eyeButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.neutral[400]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotButton}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={isLoading || !username.trim() || !password.trim()}
                    activeOpacity={0.85}
                    style={styles.signInWrapper}
                    testID="login-submit-button"
                  >
                    <LinearGradient
                      colors={
                        isLoading || !username.trim() || !password.trim()
                          ? [colors.neutral[300], colors.neutral[400]]
                          : [colors.primary[600], colors.primary[700]]
                      }
                      style={styles.signInButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {isLoading ? (
                        <View style={styles.buttonRow}>
                          <ActivityIndicator size="small" color={colors.white} />
                          <Text style={styles.signInText}>Signing In...</Text>
                        </View>
                      ) : (
                        <View style={styles.buttonRow}>
                          <Ionicons name="log-in-outline" size={20} color={colors.white} />
                          <Text style={styles.signInText}>Sign In</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>MBA Communications © {new Date().getFullYear()}</Text>
                <Text style={styles.versionText}>v1.0.0</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],     // 24
    paddingVertical: spacing['4xl'],       // 40
  },

  // Decorative
  decorCircle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    top: -60,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59, 130, 246, 0.04)',
    bottom: 80,
    left: -40,
  },

  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],          // 32
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,              // 16
    ...shadows.lg,
  },
  appName: {
    fontSize: typography.fontSize['4xl'],  // 30
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: typography.fontSize.sm,      // 12
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: spacing.xs,                 // 4
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,         // 16
    paddingHorizontal: spacing['2xl'],     // 24
    paddingVertical: spacing['3xl'],       // 32
    ...shadows.lg,
  },
  welcomeText: {
    fontSize: typography.fontSize['3xl'],  // 24
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: typography.fontSize.md,      // 14
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing.xs,                 // 4
    marginBottom: spacing['2xl'],          // 24
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.errorLight,
    paddingHorizontal: spacing.lg,         // 16
    paddingVertical: spacing.md,           // 12
    borderRadius: borderRadius.md,         // 8
    marginBottom: spacing.xl,              // 20
    gap: spacing.sm,                       // 8
  },
  errorText: {
    color: colors.semantic.errorDark,
    fontSize: typography.fontSize.sm,      // 12
    fontWeight: '500',
    flex: 1,
  },

  // Input
  inputGroup: {
    marginBottom: spacing.xl,              // 20
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,      // 12
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.sm,              // 8
  },
  inputContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.input, // '#F8FAFC'
    borderWidth: 1.5,
    borderColor: colors.neutral[200],      // '#E2E8F0'
    borderRadius: borderRadius.md,         // 8
    paddingHorizontal: spacing.lg,         // 16
  },
  inputFocused: {
    borderColor: colors.primary[500],
    backgroundColor: colors.surface.inputFocused,
    ...shadows.sm,
  },
  inputIcon: {
    marginRight: spacing.md,               // 12
  },
  textInput: {
    flex: 1,
    fontSize: typography.fontSize.md,      // 14
    color: colors.neutral[800],
    paddingVertical: 0,
  },
  eyeButton: {
    padding: spacing.xs,                   // 4
    marginLeft: spacing.sm,                // 8
  },

  // Forgot Password
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing['2xl'],          // 24
  },
  forgotText: {
    fontSize: typography.fontSize.sm,      // 12
    color: colors.primary[600],
    fontWeight: '600',
  },

  // Sign In
  signInWrapper: {
    borderRadius: borderRadius.md,         // 8
    overflow: 'hidden',
  },
  signInButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,         // 8
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,                       // 8
  },
  signInText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,      // 16
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: spacing['3xl'],             // 32
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: typography.fontSize.sm,      // 12
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: typography.fontSize.xs,      // 10
    marginTop: spacing.xs,                 // 4
  },
});

export default LoginScreen;
