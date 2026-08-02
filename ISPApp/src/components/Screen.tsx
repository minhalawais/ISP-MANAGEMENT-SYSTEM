import React from 'react';
import { View, StyleSheet, StatusBar, ViewStyle, StatusBarStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView, EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  safeAreaEdges?: ('top' | 'right' | 'bottom' | 'left')[];
  backgroundColor?: string;
  statusBarStyle?: StatusBarStyle;
  statusBarColor?: string;
  unsafe?: boolean;
}

export const Screen = (props: ScreenProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const {
    children,
    style,
    contentContainerStyle,
    safeAreaEdges = ['top', 'bottom'],
    backgroundColor = theme.colors.background,
    statusBarStyle = 'light-content',
    statusBarColor = theme.colors.primary,
    unsafe = false,
  } = props;

  const Container = unsafe ? View : SafeAreaView;

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarColor}
        translucent={true}
      />
      <Container
        style={[styles.container, contentContainerStyle]}
        edges={safeAreaEdges}
      >
        {children}
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
