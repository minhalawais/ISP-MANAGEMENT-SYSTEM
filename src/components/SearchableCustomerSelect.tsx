import { useState, useMemo } from "react"
import { Search, Users, Hash, ChevronDown } from "lucide-react"

interface Customer {
  id: string
  name: string
  internetId: string
}

interface SearchableCustomerSelectProps {
  customers: Customer[]
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onCustomerSelect?: (customerId: string) => void
  error?: string
  placeholder?: string
}

export function SearchableCustomerSelect({ 
  customers, 
  value, 
  onChange, 
  onCustomerSelect,
  error, 
  placeholder = "Search and select customer" 
}: SearchableCustomerSelectProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
  
    return customers.filter(customer => 
      (customer.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (customer.internetId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (customer.id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const selectedCustomer = customers.find(customer => customer.id === value)
  
  const handleCustomerSelect = (customerId: string) => {
    if (onCustomerSelect) {
      onCustomerSelect(customerId)
    } else {
      onChange({
        target: {
          name: "customer_id",
          value: customerId,
        },
      } as React.ChangeEvent<HTMLSelectElement>)
    }
    setIsOpen(false)
    setSearchTerm("")
  }

  return (
    <div className="relative">
      {/* Display selected customer */}
      <div 
        className={`w-full pl-10 pr-10 py-2.5 border ${
          error ? "border-coral-red" : "border-slate-gray/20"
        } rounded-lg bg-light-sky/30 text-deep-ocean cursor-pointer flex items-center transition-all duration-200 hover:border-electric-blue/30`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Users className="h-5 w-5 text-slate-gray/60" />
        </div>
        
        {selectedCustomer ? (
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Customer Name */}
              <span className="font-medium text-deep-ocean">
                {selectedCustomer.name}
              </span>
              
              {/* Internet ID */}
              <span className="flex items-center gap-1 text-sm text-electric-blue bg-electric-blue/10 px-2 py-1 rounded-md">
                <Hash className="h-3.5 w-3.5" />
                {selectedCustomer.internetId}
              </span>
              
              {/* Customer ID */}
              <span className="text-xs text-slate-gray">
                ID: {selectedCustomer.id}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-slate-gray/50">{placeholder}</span>
        )}
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown className={`h-5 w-5 text-slate-gray/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-gray/20 rounded-lg shadow-lg max-h-80 overflow-y-auto animate-dropdown">
          {/* Search input */}
          <div className="sticky top-0 bg-white p-3 border-b border-slate-gray/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-gray/60" />
              <input
                type="text"
                placeholder="Search customers by name, internet ID, or customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-gray/20 rounded-md focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Options list */}
          <div className="p-2">
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-slate-gray text-sm">
                <Search className="h-8 w-8 mx-auto mb-2 text-slate-gray/40" />
                <p>No customers found matching "{searchTerm}"</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-3 cursor-pointer rounded-lg mb-1 transition-all duration-200 hover:bg-light-sky/50 hover:border-electric-blue/20 border border-transparent ${
                    value === customer.id 
                      ? "bg-electric-blue/10 border-electric-blue/30 shadow-sm" 
                      : "bg-white"
                  }`}
                  onClick={() => handleCustomerSelect(customer.id)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Customer Name */}
                    <div className="min-w-[150px]">
                      <span className="text-xs font-semibold text-slate-gray block">CUSTOMER</span>
                      <span className="text-sm font-medium text-deep-ocean">
                        {customer.name}
                      </span>
                    </div>

                    {/* Internet ID */}
                    <div className="min-w-[120px]">
                      <span className="text-xs font-semibold text-slate-gray block">INTERNET ID</span>
                      <span className="text-sm text-electric-blue font-medium">
                        {customer.internetId}
                      </span>
                    </div>

                    {/* Customer ID */}
                    <div className="min-w-[100px]">
                      <span className="text-xs font-semibold text-slate-gray block">CUSTOMER ID</span>
                      <span className="text-xs text-slate-gray font-mono">
                        {customer.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="text-coral-red text-xs mt-1">{error}</p>}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}