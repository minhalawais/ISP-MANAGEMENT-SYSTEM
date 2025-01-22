import React, { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth.ts';
import { Combobox, Transition } from '@headlessui/react';
import { FaChevronDown, FaSearch, FaCheck } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosConfig.ts';

interface ComplaintFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  isEditing: boolean;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

export function ComplaintForm({ formData, handleInputChange, isEditing }: ComplaintFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      try {
        const [employeesResponse, customersResponse] = await Promise.all([
          axiosInstance.get('http://147.93.53.119:5000/employees/list', { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axiosInstance.get('http://147.93.53.119:5000/customers/list', { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);
        setEmployees(employeesResponse.data);
        setCustomers(customersResponse.data);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };
    fetchData();
  }, []);

  const filteredCustomers =
    query === ''
      ? customers
      : customers.filter((customer) => {
          const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
          return fullName.includes(query.toLowerCase()) || 
                 customer.id.toLowerCase().includes(query.toLowerCase());
        });

  const filteredEmployees =
    employeeQuery === ''
      ? employees
      : employees.filter((employee) => {
          const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
          return fullName.includes(employeeQuery.toLowerCase()) || 
                 employee.id.toLowerCase().includes(employeeQuery.toLowerCase());
        });

  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      handleInputChange({
        target: { name: 'customer_id', value: customer.id },
      } as React.ChangeEvent<HTMLInputElement>);
    } else {
      handleInputChange({
        target: { name: 'customer_id', value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleEmployeeChange = (employee: Employee | null) => {
    setSelectedEmployee(employee);
    if (employee) {
      handleInputChange({
        target: { name: 'assigned_to', value: employee.id },
      } as React.ChangeEvent<HTMLInputElement>);
    } else {
      handleInputChange({
        target: { name: 'assigned_to', value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className="mt-2 space-y-6">
      <input
        type="text"
        name="title"
        value={formData.title || ''}
        onChange={handleInputChange}
        placeholder="Complaint Title"
        className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
        required
      />
      
      <textarea
        name="description"
        value={formData.description || ''}
        onChange={handleInputChange}
        placeholder="Complaint Description"
        className="w-full p-3 min-h-[120px] border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm resize-y"
        required
      />

      {isEditing && (
        <div className="relative">
          <select
            name="status"
            value={formData.status || ''}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-200 rounded-lg shadow-sm appearance-none bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            required
          >
            <option value="">Select Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <FaChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}

      <div className="space-y-6">
        <Combobox value={selectedEmployee} onChange={handleEmployeeChange}>
          <div className="relative">
            <div className="relative group">
              <Combobox.Input
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                displayValue={(employee: Employee | null) => 
                  employee ? `${employee.first_name} ${employee.last_name} (${employee.id})` : ''
                }
                onChange={(event) => setEmployeeQuery(event.target.value)}
                placeholder="Assign to employee..."
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 group-hover:text-gray-500">
                <FaSearch className="h-4 w-4" aria-hidden="true" />
              </Combobox.Button>
            </div>
            
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setEmployeeQuery('')}
            >
              <Combobox.Options className="absolute z-10 mt-2 w-full overflow-auto rounded-lg bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60">
                {filteredEmployees.length === 0 && employeeQuery !== '' ? (
                  <div className="px-4 py-3 text-sm text-gray-500 italic">
                    No employees found
                  </div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <Combobox.Option
                      key={employee.id}
                      value={employee}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-3 px-4 ${
                          active ? 'bg-purple-500 text-white' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected, active }) => (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold mr-3">
                              {employee.first_name[0]}
                            </div>
                            <div>
                              <div className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className={`text-sm ${active ? 'text-purple-100' : 'text-gray-500'}`}>
                                {employee.id}
                              </div>
                            </div>
                          </div>
                          {selected && (
                            <FaCheck className={`h-4 w-4 ${active ? 'text-white' : 'text-purple-500'}`} />
                          )}
                        </div>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>

        <Combobox value={selectedCustomer} onChange={handleCustomerChange}>
          <div className="relative">
            <div className="relative group">
              <Combobox.Input
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                displayValue={(customer: Customer | null) =>
                  customer ? `${customer.first_name} ${customer.last_name} (${customer.id})` : ''
                }
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for a customer..."
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 group-hover:text-gray-500">
                <FaSearch className="h-4 w-4" aria-hidden="true" />
              </Combobox.Button>
            </div>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Combobox.Options className="absolute z-10 mt-2 w-full overflow-auto rounded-lg bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60">
                {filteredCustomers.length === 0 && query !== '' ? (
                  <div className="px-4 py-3 text-sm text-gray-500 italic">
                    No customers found
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <Combobox.Option
                      key={customer.id}
                      value={customer}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-3 px-4 ${
                          active ? 'bg-purple-500 text-white' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected, active }) => (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold mr-3">
                              {customer.first_name[0]}
                            </div>
                            <div>
                              <div className="font-medium">
                                {customer.first_name} {customer.last_name}
                              </div>
                              <div className={`text-sm ${active ? 'text-purple-100' : 'text-gray-500'}`}>
                                {customer.id}
                              </div>
                            </div>
                          </div>
                          {selected && (
                            <FaCheck className={`h-4 w-4 ${active ? 'text-white' : 'text-purple-500'}`} />
                          )}
                        </div>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>
      </div>
    </div>
  );
}