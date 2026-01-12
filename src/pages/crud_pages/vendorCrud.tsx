"use client"

import React, { useMemo, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { VendorForm } from '../../components/forms/vendorForm.tsx';
import { Phone, Mail, CreditCard, User, Eye } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  cnic: string;
  picture: string;
  cnic_front_image: string;
  cnic_back_image: string;
  agreement_document: string;
  is_active: boolean;
  created_at: string;
}

const VendorManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Vendor Management";
  }, []);

  const columns = useMemo<ColumnDef<Vendor>[]>(
    () => [
      {
        header: 'Vendor',
        accessorKey: 'name',
        cell: info => (
          <div className="flex items-center gap-3">
            {info.row.original.picture ? (
              <img 
                src={`/vendors/file/${info.row.original.id}/picture`}
                alt={info.getValue() as string}
                className="w-10 h-10 rounded-full object-cover border-2 border-electric-blue/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-electric-blue/10 flex items-center justify-center">
                <User className="h-5 w-5 text-electric-blue" />
              </div>
            )}
            <span className="font-medium text-deep-ocean">{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        header: 'Phone',
        accessorKey: 'phone',
        cell: info => (
          <div className="flex items-center gap-2 text-slate-gray">
            <Phone className="h-4 w-4" />
            {info.getValue() as string}
          </div>
        ),
      },
      {
        header: 'Email',
        accessorKey: 'email',
        cell: info => (
          <div className="flex items-center gap-2 text-slate-gray">
            <Mail className="h-4 w-4" />
            {(info.getValue() as string) || '-'}
          </div>
        ),
      },
      {
        header: 'CNIC',
        accessorKey: 'cnic',
        cell: info => (
          <div className="flex items-center gap-2 text-slate-gray">
            <CreditCard className="h-4 w-4" />
            {info.getValue() as string}
          </div>
        ),
      },
      {
        header: 'Documents',
        cell: info => {
          const vendor = info.row.original;
          const hasDocuments = vendor.cnic_front_image || vendor.cnic_back_image || vendor.agreement_document;
          
          return (
            <div className="flex items-center gap-1">
              {hasDocuments ? (
                <span className="px-2 py-1 bg-emerald-green/10 text-emerald-green rounded-md text-xs font-medium">
                  {[
                    vendor.cnic_front_image && 'CNIC Front',
                    vendor.cnic_back_image && 'CNIC Back',
                    vendor.agreement_document && 'Agreement'
                  ].filter(Boolean).length} files
                </span>
              ) : (
                <span className="px-2 py-1 bg-slate-gray/10 text-slate-gray rounded-md text-xs font-medium">
                  No files
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: 'Created',
        accessorKey: 'created_at',
        cell: info => (
          <span className="text-slate-gray text-sm">
            {new Date(info.getValue() as string).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

 return (
  <CRUDPage<Vendor>
    title="Vendor"
    endpoint="vendors"
    columns={columns}
    FormComponent={VendorForm}
    useFormData={true}
    // Add validation to ensure required fields are filled
    validateBeforeSubmit={(formData) => {
      if (!formData.name?.trim()) return "Vendor name is required";
      if (!formData.phone?.trim()) return "Phone number is required";
      if (!formData.cnic?.trim()) return "CNIC is required";
      return null;
    }}
  />
);
};

export default VendorManagement;
