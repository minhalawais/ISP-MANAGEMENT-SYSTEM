import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../../components/employee_portal/customerCrudPage.tsx';
import { CustomerForm } from '../../../components/forms/customerForm.tsx';

interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  area: string;
  service_plan: string;
  installation_address: string;
  installation_date: string;
  cnic: string;
  cnic_image: string;
  is_active: boolean;
}

const CustomerManagementForEmployee: React.FC = () => {
  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        header: 'Name',
        accessorFn: row => `${row.first_name} ${row.last_name}`,
      },
      {
        header: 'Email',
        accessorKey: 'email',
      },
      {
        header: 'Area',
        accessorKey: 'area',
      },
      {
        header: 'Service Plan',
        accessorKey: 'service_plan',
      },
      {
        header: 'Installation Date',
        accessorKey: 'installation_date',
      },
      {
        header: 'CNIC',
        accessorKey: 'cnic',
      },
      {
        header: 'CNIC Image',
        accessorKey: 'cnic_image',
        cell: (info: any) => (
          <button
            onClick={() => window.open(`/api/cnic-image/${info.row.original.id}`, '_blank')}
            className="px-2 py-1 bg-[#89A8B2] text-white text-sm rounded-md shadow-md hover:bg-[#B3C8CF] transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            View CNIC
          </button>
        ),
      },
    ],
    []
  );

  return (
    <CRUDPage<Customer>
      title="Customer"
      endpoint="customers"
      columns={columns}
      FormComponent={CustomerForm}
    />
  );
};

export default CustomerManagementForEmployee;
