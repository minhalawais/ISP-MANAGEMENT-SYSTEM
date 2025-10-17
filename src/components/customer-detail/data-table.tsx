import type React from "react"

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  className?: string
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  title?: string
  icon?: React.ReactNode
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data, title, icon }) => (
  <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] overflow-hidden">
    {title && (
      <div className="bg-gradient-to-r from-[#89A8B2] to-[#7a9aa4] px-6 py-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          {icon}
          {title}
        </h3>
      </div>
    )}
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#F1F0E8] border-b border-[#E5E1DA]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-6 py-3 text-left text-sm font-semibold text-[#2A5C8A]">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E1DA]">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
              {columns.map((column) => (
                <td key={column.key} className={`px-6 py-3 text-sm text-[#4A5568] ${column.className || ""}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export default DataTable
