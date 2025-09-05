import React, { useMemo,useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { SupplierForm } from '../../components/forms/supplierForm.tsx';

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

const SupplierManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Supplier Management";
  }, []);
  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
      },
      {
        header: 'Contact Person',
        accessorKey: 'contact_person',
      },
      {
        header: 'Email',
        accessorKey: 'email',
      },
      {
        header: 'Phone',
        accessorKey: 'phone',
      },
      {
        header: 'Address',
        accessorKey: 'address',
        cell: info => (
          <div className="max-w-xs overflow-hidden overflow-ellipsis whitespace-nowrap" title={info.getValue() as string}>
            {info.getValue() as string}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <CRUDPage<Supplier>
      title="Supplier"
      endpoint="suppliers"
      columns={columns}
      FormComponent={SupplierForm}
    />
  );
};

export default SupplierManagement;

