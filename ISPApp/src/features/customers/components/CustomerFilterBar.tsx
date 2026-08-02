import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { theme } from '../../../theme';

interface FilterOption {
  id: string;
  label: string;
}

interface Props {
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

const STATUS_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'expired', label: 'Expired' },
];

export const CustomerFilterBar: React.FC<Props> = ({ selectedStatus, onSelectStatus }) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {STATUS_OPTIONS.map((option) => {
          const isSelected = selectedStatus === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected
              ]}
              onPress={() => onSelectStatus(option.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.chipText,
                isSelected && styles.chipTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    paddingBottom: theme.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  chipSelected: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.neutral[600],
  },
  chipTextSelected: {
    color: theme.colors.white,
  },
});
