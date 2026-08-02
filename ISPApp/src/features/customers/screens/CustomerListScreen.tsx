import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Screen } from '../../../components/Screen';
import { CustomerCard } from '../components/CustomerCard';
import { CustomerListEmpty } from '../components/CustomerListEmpty';
import { CustomerFilterBar } from '../components/CustomerFilterBar';
import { useCustomers } from '../hooks/useCustomers';
import { theme } from '../../../theme';
import { Searchbar, FAB } from 'react-native-paper';
import { Customer } from '../types';

export const CustomerListScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const { 
    data, 
    isLoading, 
    error, 
    refresh, 
    loadMore, 
    search 
  } = useCustomers();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    search(query); // Should ideally be debounced
  };

  const handleFilter = (status: string) => {
    setSelectedStatus(status);
    // In a real app, this would trigger a refetch with status param
    // For now, let's assume the hook handles it or we filter locally if data is small
    // refresh({ status: status === 'all' ? undefined : status });
  };

  const renderItem = ({ item }: { item: Customer }) => (
    <CustomerCard 
      customer={item} 
      onPress={(customer) => console.log('Navigate to detail', customer.id)} 
    />
  );

  return (
    <Screen style={styles.container}>
      {/* Header Area */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search customers..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={theme.colors.neutral[400]}
          elevation={0}
        />
      </View>

      {/* Filter Bar */}
      <CustomerFilterBar 
        selectedStatus={selectedStatus} 
        onSelectStatus={handleFilter} 
      />

      {/* Main List */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && data.length === 0}
            onRefresh={refresh}
            colors={[theme.colors.primary[600]]}
            tintColor={theme.colors.primary[600]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <CustomerListEmpty 
              message={error || (searchQuery ? `No results for "${searchQuery}"` : "No customers found")} 
            />
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading && data.length > 0 ? (
            <View style={styles.loaderFooter}>
              <ActivityIndicator color={theme.colors.primary[600]} />
            </View>
          ) : null
        }
      />

      {/* FAB for Add Customer */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={theme.colors.white}
        onPress={() => console.log('Navigate to Add Customer')}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
  },
  searchBar: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    height: 48,
  },
  searchInput: {
    fontSize: 14,
    color: theme.colors.neutral[900],
    minHeight: 0, 
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 80, // Space for FAB
  },
  loaderFooter: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary[600],
    borderRadius: 999,
  },
});
