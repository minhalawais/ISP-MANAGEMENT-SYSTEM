import React, { useMemo,useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { ServicePlanForm } from '../../components/forms/servicePlanForm.tsx';
import { Toggle } from '../../components/toggle.tsx';

interface ServicePlan {
  id: string;
  name: string;
  description: string;
  speed_mbps: number;
  data_cap_gb: number;
  price: number;
  is_active: boolean;
}

const ServicePlanManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Service Plan Management";
  }, []);
  const columns = useMemo<ColumnDef<ServicePlan>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
      },
      {
        header: 'Speed (Mbps)',
        accessorKey: 'speed_mbps',
      },
      {
        header: 'Data Cap (GB)',
        accessorKey: 'data_cap_gb',
      },
      {
        header: 'Price',
        accessorKey: 'price',
        cell: info => `PKR ${info.getValue<number>().toFixed(2)}`,
      },
    ],
    []
  );

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // Implementation will be handled in the CRUDPage component
  };

  return (
    <CRUDPage<ServicePlan>
      title="Service Plan"
      endpoint="service-plans"
      columns={columns}
      FormComponent={ServicePlanForm}
    />
  );
};

export default ServicePlanManagement;

