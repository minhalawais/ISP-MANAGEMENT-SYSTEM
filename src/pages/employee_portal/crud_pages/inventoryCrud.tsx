import React, { useMemo, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../../components/employee_portal/crudPage.tsx';
import { InventoryForm } from '../../../components/forms/inventoryForm.tsx';
import axiosInstance from '../../../utils/axiosConfig.ts';
import { getToken } from '../../../utils/auth.ts';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  serial_number: string;
  status: string;
  supplier_id: string;
  supplier_name: string;
  is_active: boolean;
}

const EmployeeInventoryManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const token = getToken();
        const response = await axiosInstance.get('/suppliers/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuppliers(response.data);
      } catch (error) {
        console.error('Failed to fetch suppliers', error);
      }
    };

    fetchSuppliers();
  }, []);

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
      },
      {
        header: 'Description',
        accessorKey: 'description',
      },
      {
        header: 'Serial Number',
        accessorKey: 'serial_number',
      },
      {
        header: 'Status',
        accessorKey: 'status',
      },
      {
        header: 'Supplier',
        accessorKey: 'supplier_name',
      },
    ],
    []
  );

  const validateBeforeSubmit = (formData: Partial<InventoryItem>) => {
    if (!formData.name || formData.name.trim() === '') {
      return 'Item name is required';
    }
    if (!formData.serial_number || formData.serial_number.trim() === '') {
      return 'Serial number is required';
    }
    if (!formData.status) {
      return 'Status is required';
    }
    if (!formData.supplier_id) {
      return 'Supplier is required';
    }
    return null;
  };

  return (
    <CRUDPage<InventoryItem>
      title="Inventory"
      endpoint="inventory"
      columns={columns}
      FormComponent={(props) => <InventoryForm {...props} suppliers={suppliers} />}
      validateBeforeSubmit={validateBeforeSubmit}
    />
  );
};

export default EmployeeInventoryManagement;

