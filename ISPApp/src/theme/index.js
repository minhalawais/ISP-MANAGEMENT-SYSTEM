import { MD3LightTheme } from 'react-native-paper';

export const colors = {
// ... existing colors ...
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',    // Secondary buttons, links, icons
    600: '#2563EB',    // Primary buttons, active tabs
    700: '#1D4ED8',    // Button hover, pressed
    800: '#1E40AF',    // Main Primary — Headers, emphasis
    900: '#1E3A8A',    // Dark text on light primary bg
  },
  secondary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  neutral: {
    50: '#F8FAFC',     // Screen backgrounds
    100: '#F1F5F9',    // Card hover, alt rows
    200: '#E2E8F0',    // Borders, dividers
    300: '#CBD5E1',    // Disabled, placeholder
    400: '#94A3B8',    // Secondary icons, captions
    500: '#64748B',    // Secondary text, labels
    600: '#475569',    // Body text (less emphasis)
    700: '#334155',    // Body text (standard)
    800: '#1E293B',    // Headings, important text
    900: '#0F172A',    // Primary text, titles
  },
  semantic: {
    success: '#10B981',
    successLight: '#D1FAE5',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
  },
  background: {
    primary: '#F8FAFC',
    secondary: '#FFFFFF',
    tertiary: '#F1F5F9',
  },
  surface: {
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.5)',
    input: '#F8FAFC',
    inputFocused: '#FFFFFF',
  },
  white: '#FFFFFF',
  black: '#000000',
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 30,
    '5xl': 36,
  },
  lineHeight: {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    '2xl': 28,
    '3xl': 32,
    '4xl': 40,
    '5xl': 44,
  },
};

export const textStyles = {
  screenTitle: { fontSize: 24, fontWeight: '700', color: colors.neutral[900], letterSpacing: -0.3 },
  screenSubtitle: { fontSize: 14, fontWeight: '400', color: colors.neutral[500] },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.neutral[800], letterSpacing: -0.2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.neutral[800] },
  body: { fontSize: 14, fontWeight: '400', color: colors.neutral[700], lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400', color: colors.neutral[500], lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '500', color: colors.neutral[600], letterSpacing: 0.3 },
  buttonLarge: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.3 },
  buttonMedium: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  statValue: { fontSize: 30, fontWeight: '700', color: colors.neutral[900], letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '500', color: colors.neutral[500] },
  badge: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary[600],
    secondary: colors.secondary[500],
    error: colors.semantic.error,
    background: colors.background.primary,
    surface: colors.surface.card,
    outline: colors.neutral[200],
  },
  customColors: colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  textStyles,
};

export default theme;
