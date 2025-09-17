"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { CSVLink } from "react-csv"
import type { ColumnDef } from "@tanstack/react-table"
import { FaPlus, FaFileExport, FaPen, FaTrash, FaFileInvoice, FaEye } from "react-icons/fa"
import { Table } from "../table/table.tsx"
import { Modal } from "../modal.tsx"
import { Topbar } from "../topNavbar.tsx"
import { Sidebar } from "../sideNavbar.tsx"
import { getToken } from "../../utils/auth.ts"
import { toast } from "react-toastify"
import axiosInstance from "../../utils/axiosConfig.ts"

interface CRUDPageProps<T> {
  title: string
  endpoint: string
  columns: ColumnDef<T>[]
  FormComponent: React.ComponentType<{
    formData: Partial<T>
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
    isEditing: boolean
  }>
}

export function CRUDPage<T extends { id: string }>({ title, endpoint, columns, FormComponent }: CRUDPageProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Partial<T>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get(`/${endpoint}/list`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(response.data)
    } catch (error) {
      console.error(`Failed to fetch ${title}`, error)
      toast.error(`Failed to fetch ${title}`)
    }
  }

  const showModal = (item: T | null) => {
    setEditingItem(item)
    setFormData(item || {})
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingItem(null)
    setFormData({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = getToken()
      if (editingItem) {
        await axiosInstance.put(`/${endpoint}/update/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(`${title} updated successfully`)
      } else {
        console.log("formData", formData)
        await axiosInstance.post(`/${endpoint}/add`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(`${title} added successfully`)
      }
      fetchData()
      handleCancel()
    } catch (error) {
      console.error("Operation failed", error)
      toast.error("Operation failed")
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) {
      try {
        const token = getToken()
        await axiosInstance.delete(`/${endpoint}/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(`${title} deleted successfully`)
        fetchData()
      } catch (error) {
        console.error("Delete operation failed", error)
        toast.error("Delete operation failed")
      }
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = getToken()
      await axiosInstance.patch(
        `/${endpoint}/toggle-status/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      toast.success(`${title} status updated successfully`)
      fetchData()
    } catch (error) {
      console.error("Toggle status failed", error)
      toast.error("Failed to update status")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const handleWhatsAppShare = (invoice: any) => {
    console.log('invoice', invoice)
    if (!invoice.customer_phone) {
      toast.error("Customer phone number not available")
      return
    }

    let phoneNumber = invoice.customer_phone.replace(/\D/g, "")
    if (!phoneNumber.startsWith("92")) {
      phoneNumber = "92" + phoneNumber.substring(1)
    }
    console.log('phoneNumber', phoneNumber)
    const message = `Hi ${invoice.customer_name},

Your invoice #${invoice.invoice_number} for PKR ${Number.parseFloat(invoice.total_amount).toFixed(2)} is ready.

Invoice Details:
• Amount: PKR ${Number.parseFloat(invoice.total_amount).toFixed(2)}
• Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
• Status: ${invoice.status}

Please check your invoice details and make payment if pending.

Thank you for choosing MBA Communications!`

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const memoizedColumns = useMemo(() => {
    return [
      ...columns,
      {
        header: "View",
        cell: (info: any) => (
          <div className="flex justify-center">
            <button
              onClick={() => window.open(`/${endpoint}/${info.row.original.id}`, "_blank")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm shadow-md hover:shadow-lg"
              title="View Invoice"
            >
              <FaEye className="w-4 h-4" />
              View Invoice
            </button>
          </div>
        ),
      },
      {
        header: "Share",
        cell: (info: any) => (
          <div className="flex justify-center">
            <button
              onClick={() => handleWhatsAppShare(info.row.original)}
              className="flex items-center gap-2 px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors duration-200 text-sm shadow-md hover:shadow-lg"
              title="Share via WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z" />
              </svg>
              Share
            </button>
          </div>
        ),
      },
      {
        header: "Actions",
        cell: (info: any) => (
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => showModal(info.row.original)}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50"
              title="Edit"
            >
              <FaPen className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2 rounded-lg hover:bg-red-50"
              title="Delete"
            >
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ]
  }, [columns])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 pt-20 transition-all duration-300 ${isSidebarOpen ? "ml-72" : "ml-20"}`}
        >
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4 text-balance">{title} Management</h1>
              <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </div>

            <div className="flex justify-end mb-6 space-x-4">
              <button
                onClick={() => showModal(null)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center shadow-md hover:shadow-lg"
              >
                <FaPlus className="mr-2" /> Add New {title}
              </button>
              <CSVLink
                data={data}
                filename={`${title.toLowerCase()}.csv`}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center shadow-md hover:shadow-lg"
              >
                <FaFileExport className="mr-2" /> Export to CSV
              </CSVLink>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <Table data={data} columns={memoizedColumns} />
            </div>
          </div>
        </main>
      </div>

      <Modal
        isVisible={isModalVisible}
        onClose={handleCancel}
        title={editingItem ? `Edit ${title}` : `Add New ${title}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormComponent formData={formData} handleInputChange={handleInputChange} isEditing={!!editingItem} />
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              {editingItem ? "Update" : "Add"} {title}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}