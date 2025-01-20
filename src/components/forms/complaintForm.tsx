import React, { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth.ts';
import { Combobox, Transition } from '@headlessui/react';
import { FaChevronDown, FaSearch, FaCheck, FaPaperclip } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosConfig.ts';

interface ComplaintFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
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

const categories = [
  'Billing',
  'Technical Support',
  'Service Quality',
  'Customer Service',
  'Installation',
  'Equipment',
  'Other'
];

const priorityColors = {
  low: 'bg-blue-50 text-blue-700',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700'
};

export function ComplaintForm({ formData, handleInputChange, handleFileChange, handleSubmit, isEditing }: ComplaintFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [fileSelected, setFileSelected] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      try {
        const [employeesResponse, customersResponse] = await Promise.all([
          axiosInstance.get('/employees/list', { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axiosInstance.get('/customers/list', { 
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

  const filteredCustomers = query === ''
    ? customers
    : customers.filter((customer) => {
        const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
        return fullName.includes(query.toLowerCase()) || 
               customer.id.toLowerCase().includes(query.toLowerCase());
      });

  const filteredEmployees = employeeQuery === ''
    ? employees
    : employees.filter((employee) => {
        const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
        return fullName.includes(employeeQuery.toLowerCase()) || 
               employee.id.toLowerCase().includes(employeeQuery.toLowerCase());
      });

  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    handleInputChange({
      target: { name: 'customer_id', value: customer?.id || '' },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleEmployeeChange = (employee: Employee | null) => {
    setSelectedEmployee(employee);
    handleInputChange({
      target: { name: 'assigned_to', value: employee?.id || '' },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileSelected(e.target.files && e.target.files.length > 0);
    handleFileChange(e);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* Employee Combobox */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Assign Employee</label>
          <Combobox value={selectedEmployee} onChange={handleEmployeeChange}>
            <div className="relative">
              <div className="relative group">
                <Combobox.Input
                  className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  displayValue={(employee: Employee | null) => 
                    employee ? `${employee.first_name} ${employee.last_name} (${employee.id})` : ''
                  }
                  onChange={(event) => setEmployeeQuery(event.target.value)}
                  placeholder="Search employee..."
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
                  {filteredEmployees?.length === 0 && employeeQuery !== '' ? (
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
        </div>

        {/* Customer Combobox */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select Customer</label>
          <Combobox value={selectedCustomer} onChange={handleCustomerChange}>
            <div className="relative">
              <div className="relative group">
                <Combobox.Input
                  className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  displayValue={(customer: Customer | null) =>
                    customer ? `${customer.first_name} ${customer.last_name} (${customer.id})` : ''
                  }
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search customer..."
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
                  {filteredCustomers?.length === 0 && query !== '' ? (
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

        {/* Complaint Details */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Complaint Title</label>
          <input
            type="text"
            name="title"
            value={formData.title || ''}
            onChange={handleInputChange}
            placeholder="Enter complaint title"
            className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            placeholder="Provide detailed description"
            className="w-full p-3 min-h-[120px] border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm resize-y"
            required
          />
        </div>

        {/* Category and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={formData.category || ''}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 appearance-none"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              name="priority"
              value={formData.priority || ''}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 appearance-none"
              required
            >
              <option value="">Select Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Due Date and File Upload */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Response Due Date</label>
            <input
              type="date"
              name="response_due_date"
              value={formData.response_due_date || ''}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Attachment</label>
            <div className="relative">
              <input
                type="file"
                name="attachment"
                id="file-upload"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
              <div className="w-full p-3 border border-gray-200 rounded-lg flex items-center justify-center space-x-2 bg-white/50 backdrop-blur-sm hover:bg-gray-50 transition-all duration-200">
                <FaPaperclip className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {fileSelected ? 'File selected' : 'Click to upload or drag and drop'}
                </span>
              </div>
            </div>
            {fileSelected && (
              <p className="text-xs text-gray-500 mt-1">
                File selected. Click again to change.
              </p>
            )}
          </div>
        </div>

        {/* Status Selection (Only visible when editing) */}
        {isEditing && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
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
          </div>
        )}
      </div>
    </div>
  );
}