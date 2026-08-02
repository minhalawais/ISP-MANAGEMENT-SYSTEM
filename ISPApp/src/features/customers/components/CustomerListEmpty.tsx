import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme';

interface Props {
  message?: string;
  onAction?: () => void;
}

export const CustomerListEmpty: React.FC<Props> = ({ message = 'No customers found', onAction }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="people-outline" size={32} color={theme.colors.neutral[400]} />
      </View>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subMessage}>Try adjusting your filters or search query.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.neutral[50], // Very light gray
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[800],
    marginBottom: 4,
  },
  subMessage: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    maxWidth: 240,
  },
});
