import React, { useMemo,useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { LogForm } from '../../components/forms/logForm.tsx';

interface Log {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: string;
  new_values: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

const LogManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Logs Management";
  }, []);
  const columns = useMemo<ColumnDef<Log>[]>(
    () => [
      {
        header: 'User',
        accessorKey: 'user_name',
      },
      {
        header: 'Action',
        accessorKey: 'action',
        cell: info => (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${info.getValue() === 'CREATE' ? 'bg-green-100 text-green-800' : 
              info.getValue() === 'UPDATE' ? 'bg-blue-100 text-blue-800' : 
              info.getValue() === 'DELETE' ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        header: 'Table',
        accessorKey: 'table_name',
      },
      {
        header: 'Record ID',
        accessorKey: 'record_id',
      },
      {
        header: 'IP Address',
        accessorKey: 'ip_address',
      },
      {
        header: 'Timestamp',
        accessorKey: 'timestamp',
        cell: info => new Date(info.getValue() as string).toLocaleString(),
      },
    ],
    []
  );

  return (
    <CRUDPage<Log>
      title="Log"
      endpoint="logs"
      columns={columns}
      FormComponent={LogForm}
    />
  );
};

export default LogManagement;

