import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../../components/employee_portal/crudPage.tsx';
import { EmployeeForm } from '../../../components/forms/employeeForm.tsx';

interface Employee {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  contact_number: string;
  cnic: string;
}

const EmployeeManagementPortal: React.FC = () => {
  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        header: 'Name',
        accessorFn: row => `${row.first_name} ${row.last_name}`,
      },
      {
        header: 'Username',
        accessorKey: 'username',
      },
      {
        header: 'Email',
        accessorKey: 'email',
      },
      {
        header: 'Contact Number',
        accessorKey: 'contact_number',
      },
      {
        header: 'CNIC',
        accessorKey: 'cnic',
      },
      {
        header: 'Role',
        accessorKey: 'role',
        cell: info => (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            {info.getValue() as string}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <CRUDPage<Employee>
    title="Employee"
    endpoint="employees"
    columns={columns}
    FormComponent={EmployeeForm}
    validateBeforeSubmit={(formData) => {
      if (!formData.username || !formData.email) {
        return 'Username and email are required';
      }
      return null;
    }}
  />
  );
};

export default EmployeeManagementPortal;
