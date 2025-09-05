import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { MessageForm } from '../../components/forms/messageForm.tsx';

interface Message {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  is_active: boolean;
}

const MessageManagement: React.FC = () => {
  const columns = useMemo<ColumnDef<Message>[]>(
    () => [
      {
        header: 'Sender',
        accessorKey: 'sender',
      },
      {
        header: 'Recipient',
        accessorKey: 'recipient',
      },
      {
        header: 'Subject',
        accessorKey: 'subject',
      },
      {
        header: 'Content',
        accessorKey: 'content',
        cell: info => (
          <div className="max-w-xs overflow-hidden overflow-ellipsis whitespace-nowrap" title={info.getValue() as string}>
            {info.getValue() as string}
          </div>
        ),
      },
      {
        header: 'Read',
        accessorKey: 'is_read',
        cell: info => info.getValue() ? 'Yes' : 'No',
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        cell: info => new Date(info.getValue() as string).toLocaleString(),
      },
    ],
    []
  );

  return (
    <CRUDPage<Message>
      title="Message"
      endpoint="messages"
      columns={columns}
      FormComponent={MessageForm}
    />
  );
};

export default MessageManagement;

