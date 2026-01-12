import { useState, useMemo } from "react"
import { Search, FileText, User, Hash, Calendar, DollarSign, ChevronDown } from "lucide-react"

interface SearchableSelectProps {
  options: any[]
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  error?: string
  placeholder?: string
}

export function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  error, 
  placeholder = "Search and select invoice" 
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    
    return options.filter(option => 
      option.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.customer_internet_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  const selectedInvoice = options.find(opt => opt.id === value)

  // Format date function
  const formatDateRange = (startDate: string, endDate: string) => {
    const format = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return `${format(start)} - ${format(end)}`
  }

  return (
    <div className="relative">
      {/* Display selected invoice */}
      <div 
        className={`w-full pl-10 pr-10 py-2.5 border ${
          error ? "border-coral-red" : "border-slate-gray/20"
        } rounded-lg bg-light-sky/30 text-deep-ocean cursor-pointer flex items-center transition-all duration-200 hover:border-electric-blue/30`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FileText className="h-5 w-5 text-slate-gray/60" />
        </div>
        
        {selectedInvoice ? (
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Invoice Number */}
              <span className="bg-deep-ocean/10 px-2 py-1 rounded-md text-sm font-medium text-deep-ocean">
                {selectedInvoice.invoice_number}
              </span>
              
              {/* Customer Info */}
              <span className="flex flex-col gap-1 text-sm">
                {/* Customer Name */}
                <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-gray" />
                    <span className="font-medium">{selectedInvoice.customer_name}</span>
                </span>

                {/* Internet ID */}
                <span className="flex items-center gap-1 text-electric-blue">
                    <Hash className="h-3.5 w-3.5" />
                    {selectedInvoice.customer_internet_id}
                </span>
            </span>

              {/* Date Range */}
              {selectedInvoice.billing_start_date && selectedInvoice.billing_end_date && (
                <span className="flex items-center gap-1 text-sm text-slate-gray bg-slate-gray/10 px-2 py-1 rounded-md">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateRange(selectedInvoice.billing_start_date, selectedInvoice.billing_end_date)}
                </span>
              )}
              
              {/* Amount */}
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-green bg-emerald-green/10 px-2 py-1 rounded-md ml-auto">
                PKR{selectedInvoice.total_amount}
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-gray/20 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {/* Search input */}
          <div className="sticky top-0 bg-white p-3 border-b border-slate-gray/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-gray/60" />
              <input
                type="text"
                placeholder="Search by customer name, internet ID, or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-gray/20 rounded-md focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Options list */}
          <div className="p-2">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-gray text-sm">
                <Search className="h-8 w-8 mx-auto mb-2 text-slate-gray/40" />
                <p>No invoices found matching "{searchTerm}"</p>
              </div>
            ) : (
              filteredOptions.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`p-3 cursor-pointer rounded-lg mb-1 transition-all duration-200 hover:bg-light-sky/50 hover:border-electric-blue/20 border border-transparent ${
                    value === invoice.id 
                      ? "bg-electric-blue/10 border-electric-blue/30 shadow-sm" 
                      : "bg-white"
                  }`}
                  onClick={() => {
                    onChange({
                      target: {
                        name: "invoice_id",
                        value: invoice.id,
                      },
                    } as React.ChangeEvent<HTMLSelectElement>)
                    setIsOpen(false)
                    setSearchTerm("")
                  }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Invoice Number - Highlighted */}
                    <div className="bg-deep-ocean/10 px-2.5 py-1.5 rounded-lg min-w-[80px]">
                      <span className="text-xs font-semibold text-deep-ocean block">INVOICE</span>
                      <span className="text-sm font-bold text-deep-ocean">{invoice.invoice_number}</span>
                    </div>

                    {/* Customer Info */}
                    <div className="min-w-[120px] flex flex-col gap-1 text-sm">
                      <span className="text-xs font-semibold text-slate-gray block">CUSTOMER</span>
                      <span className="text-sm font-medium text-deep-ocean truncate max-w-[100px]">
                        {invoice.customer_name}
                      </span>
                      <span className="text-sm text-electric-blue font-medium">
                        {invoice.customer_internet_id}
                      </span>
                    </div>

                    {/* Date Range */}
                    {invoice.billing_start_date && invoice.billing_end_date && (
                      <div className="min-w-[120px]">
                        <span className="text-xs font-semibold text-slate-gray block">BILLING PERIOD</span>
                        <span className="text-sm text-slate-700 font-medium">
                          {formatDateRange(invoice.billing_start_date, invoice.billing_end_date)}
                        </span>
                      </div>
                    )}

                    {/* Amount */}
                    <div className="min-w-[80px] ml-auto text-right">
                      <span className="text-xs font-semibold text-slate-gray block">AMOUNT</span>
                      <span className="text-sm font-bold text-emerald-green">
                        PKR{parseFloat(invoice.total_amount).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Due Date if available */}
                  {invoice.due_date && (
                    <div className="mt-2 pt-2 border-t border-slate-gray/10">
                      <span className="text-xs text-slate-gray flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
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