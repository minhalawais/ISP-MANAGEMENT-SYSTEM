import { useState, useCallback, useEffect } from 'react';
import { Customer, CustomerListParams } from '../types';
import { CustomerService } from '../services/customer.service';

export const useCustomers = () => {
  const [data, setData] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [filters, setFilters] = useState<CustomerListParams>({
    page: 1,
    limit: 10,
    search: '',
  });

  const fetchCustomers = useCallback(async (params: CustomerListParams = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const mergedParams = { ...filters, ...params };
      const response = await CustomerService.getCustomers(mergedParams);
      
      if (mergedParams.page === 1) {
        setData(response.data);
      } else {
        setData(prev => [...prev, ...response.data]);
      }
      
      setPagination({
        page: response.page,
        total: response.total,
        limit: mergedParams.limit || 10,
        pages: response.pages,
      });
      
      setFilters(prev => ({ ...prev, ...params }));
    } catch (err: any) {
      setData([]);
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const refresh = useCallback(() => {
    fetchCustomers({ page: 1 });
  }, [fetchCustomers]);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !isLoading) {
      fetchCustomers({ page: pagination.page + 1 });
    }
  }, [pagination, isLoading, fetchCustomers]);

  const search = useCallback((query: string) => {
    fetchCustomers({ page: 1, search: query });
  }, [fetchCustomers]);

  return {
    data,
    isLoading,
    error,
    pagination,
    refresh,
    loadMore,
    search,
  };
};
