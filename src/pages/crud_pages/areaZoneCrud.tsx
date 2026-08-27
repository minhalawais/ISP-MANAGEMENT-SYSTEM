import React, { useMemo, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { AreaZoneForm } from '../../components/forms/areaZoneForm.tsx';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useCompany } from "../../context/CompanyContext.tsx";

interface AreaZone {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_public: boolean;
  sub_zones_count?: number;
}

const AreaZoneManagement: React.FC = () => {
  const navigate = useNavigate();
  const { setPageTitle } = useCompany();

  useEffect(() => {
    setPageTitle("Area Management");
  }, [setPageTitle]);

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
      },
      {
        header: 'Sub-Zones',
        accessorKey: 'sub_zones_count',
        cell: info => (
          <button
            onClick={() => navigate(`/areas/${info.row.original.id}/sub-zones`)}
            className="flex items-center gap-1 px-2 py-1 bg-electric-blue/10 text-electric-blue rounded-md hover:bg-electric-blue/20 transition-colors text-sm"
          >
            <MapPin className="h-3 w-3" />
            {(info.getValue() as number) || 0} sub-zones
          </button>
        ),
      },
      { header: 'Website', accessorKey: 'is_public', cell: info => info.getValue<boolean>() ? 'Published' : 'Private' },
    ],
    [navigate]
  );

  return (
    <CRUDPage<AreaZone>
      title="Area/Zone"
      endpoint="areas"
      filterModuleKey="area-zone"
      columns={columns}
      FormComponent={AreaZoneForm}
    />
  );
};

export default AreaZoneManagement;
