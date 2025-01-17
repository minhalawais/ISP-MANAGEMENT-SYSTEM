import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/customerCrudPage.tsx';
import { CustomerForm } from '../../components/forms/customerForm.tsx';
import { getToken } from '../../utils/auth.ts';

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

const CustomerManagement: React.FC = () => {
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
            onClick={() => {
              const token = getToken(); // Assuming getToken() retrieves the Bearer token
              fetch(`http://127.0.0.1:5000/customers/cnic-image/${info.row.original.id}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              .then(response => response.blob())
              .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
              })
              .catch(error => console.error('Error:', error));
            }}
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

export default CustomerManagement;

