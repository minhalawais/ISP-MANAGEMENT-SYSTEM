import React, { useMemo,useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { ServicePlanForm } from '../../components/forms/servicePlanForm.tsx';
import { useCompany } from "../../context/CompanyContext.tsx";

interface ServicePlan {
  id: string;
  name: string;
  description: string;
  speed_mbps: number;
  data_cap_gb: number;
  price: number;
  is_active: boolean;
  isp_id: string | null;
  isp_name: string | null;
  is_public: boolean;
  product_type: string;
}

const ServicePlanManagement: React.FC = () => {
  const { setPageTitle } = useCompany();

  useEffect(() => {
    setPageTitle("Service Plan Management");
  }, [setPageTitle]);
  const columns = useMemo<ColumnDef<ServicePlan>[]>(
    () => [
      {
        header: 'ISP',
        accessorKey: 'isp_name',
        cell: info => info.getValue<string>() || 'Unassigned',
      },
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
      { header: 'Type', accessorKey: 'product_type' },
      { header: 'Website', accessorKey: 'is_public', cell: info => info.getValue<boolean>() ? 'Published' : 'Private' },
    ],
    []
  );

  return (
    <CRUDPage<ServicePlan>
      title="Service Plan"
      endpoint="service-plans"
      filterModuleKey="service-plan"
      columns={columns}
      FormComponent={ServicePlanForm}
    />
  );
};

export default ServicePlanManagement;
