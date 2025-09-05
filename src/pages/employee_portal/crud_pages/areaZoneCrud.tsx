import React, { useMemo,useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../../components/employee_portal/crudPage.tsx';
import { AreaZoneForm } from '../../../components/employee_portal/forms/areaZoneForm.tsx';

interface AreaZone {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

const AreaZoneManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Are Management";
  }, []);
  const columns = useMemo<ColumnDef<AreaZone>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
      },
      {
        header: 'Description',
        accessorKey: 'description',
        cell: info => (
          <div className="max-w-xs overflow-hidden overflow-ellipsis whitespace-nowrap" title={info.getValue() as string}>
            {info.getValue() as string}
          </div>
        ),
      }
    ],
    []
  );

  return (
    <CRUDPage<AreaZone>
      title="Area/Zone"
      endpoint="areas"
      columns={columns}
      FormComponent={AreaZoneForm}
    />
  );
};

export default AreaZoneManagement;

