// logsCrud.tsx - Updated
import React, { useMemo, useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { LogsCRUDPage } from '../../components/logsCrudPage.tsx'; 
import { LogForm } from '../../components/forms/logForm.tsx';
import { Eye, X } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig.ts';
import { getToken } from '../../utils/auth.ts';

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
  created_at: string;
}

const LogManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Logs Management";
  }, []);

  const [selectedRecord, setSelectedRecord] = useState<{tableName: string, recordId: string} | null>(null);
  const [recordDetails, setRecordDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const fetchRecordDetails = async (tableName: string, recordId: string) => {
    setIsLoadingDetails(true);
    setDetailsError(null);
    setRecordDetails(null);
    try {
        const token = getToken();
        const res = await axiosInstance.get(`/logs/record-details`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { table_name: tableName, record_id: recordId }
        });
        setRecordDetails(res.data);
    } catch (err: any) {
        setDetailsError(err.response?.data?.error || "Failed to fetch details");
    } finally {
        setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedRecord) {
        fetchRecordDetails(selectedRecord.tableName, selectedRecord.recordId);
    }
  }, [selectedRecord]);

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
        header: 'Record Details',
        accessorKey: 'record_id',
        cell: info => {
            const recordId = info.getValue() as string;
            const tableName = info.row.original.table_name;
            return (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-mono text-xs">{recordId.substring(0, 8)}...</span>
                    <button 
                        onClick={() => setSelectedRecord({tableName, recordId})}
                        className="text-electric-blue hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                        title="View Record Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
            );
        }
      },
      {
        header: 'IP Address',
        accessorKey: 'ip_address',
      },
      {
        header: 'Timestamp',
        accessorKey: 'created_at',
        cell: info => new Date(info.getValue() as string).toLocaleString(),
      },
    ],
    []
  );

  return (
    <>
        <LogsCRUDPage<Log>
        title="Log"
        endpoint="logs"
        columns={columns}
        FormComponent={LogForm}
        />

        {/* Record Details Modal */}
        {selectedRecord && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-800">Record Details</h3>
                        <button 
                            onClick={() => setSelectedRecord(null)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {isLoadingDetails ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
                            </div>
                        ) : detailsError ? (
                            <div className="text-center py-6 text-red-500 bg-red-50 rounded-lg border border-red-100">
                                <p className="font-medium">Error</p>
                                <p className="text-sm mt-1">{detailsError}</p>
                            </div>
                        ) : recordDetails ? (
                            <div className="space-y-3">
                                {Object.entries(recordDetails).map(([key, value]) => (
                                    <div key={key} className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-sm font-medium text-gray-500">{key}</span>
                                        <span className="text-sm font-semibold text-gray-800 text-right">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">No details avaliable</p>
                        )}
                    </div>
                    
                    <div className="p-4 bg-gray-50 border-t flex justify-end">
                        <button 
                            onClick={() => setSelectedRecord(null)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default LogManagement;