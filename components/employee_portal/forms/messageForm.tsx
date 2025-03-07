import React, { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth.ts';
import { Combobox, Transition } from '@headlessui/react';
import { FaChevronDown, FaSearch, FaCheck } from 'react-icons/fa';

interface MessageFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isEditing: boolean;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
}

export function MessageForm({ formData, handleInputChange, isEditing }: MessageFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const token = getToken();
      try {
        const response = await axiosInstance.get('http://147.93.53.119/api/customers/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomers(response.data);
      } catch (error) {
        console.error('Failed to fetch customers', error);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers =
    query === ''
      ? customers
      : customers.filter((customer) => {
          const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
          return fullName.includes(query.toLowerCase()) ||
                 customer.id.toLowerCase().includes(query.toLowerCase());
        });

  const handleCustomerChange = (selectedCustomers: Customer[]) => {
    setSelectedCustomers(selectedCustomers);
    handleInputChange({
      target: {
        name: 'recipient_ids',
        value: selectedCustomers.map(customer => customer.id).join(',')
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const selectAllCustomers = () => {
    setSelectedCustomers(customers);
    handleInputChange({
      target: {
        name: 'recipient_ids',
        value: customers.map(customer => customer.id).join(',')
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="mt-2 space-y-4">
      <Combobox value={selectedCustomers} onChange={handleCustomerChange} multiple>
        <div className="relative">
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={(customers: Customer[]) =>
                customers.map(c => `${c.first_name} ${c.last_name}`).join(', ')
              }
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Select recipients..."
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <FaChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              <div className="px-4 py-2">
                <button
                  onClick={selectAllCustomers}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
              </div>
              {filteredCustomers.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Nothing found.
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <Combobox.Option
                    key={customer.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-teal-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={customer}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {customer.first_name} {customer.last_name}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-teal-600'
                            }`}
                          >
                            <FaCheck className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>

      <input
        type="text"
        name="subject"
        value={formData.subject || ''}
        onChange={handleInputChange}
        placeholder="Subject"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <textarea
        name="content"
        value={formData.content || ''}
        onChange={handleInputChange}
        placeholder="Message Content"
        className="w-full p-2 border border-gray-300 rounded-md"
        rows={5}
        required
      />
      {isEditing && (
        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_read"
            checked={formData.is_read || false}
            onChange={handleInputChange}
            className="mr-2"
          />
          <label htmlFor="is_read">Mark as Read</label>
        </div>
      )}
    </div>
  );
}

