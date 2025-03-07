"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ComplaintForm } from "../components/forms/complaintForm.tsx"
import { getToken } from "../utils/auth.ts"
import axiosInstance from "../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import { FaArrowLeft } from "react-icons/fa"

const NewComplaintPage: React.FC = () => {
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, attachment: e.target.files![0] }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const formDataToSend = new FormData()
    Object.keys(formData).forEach((key) => {
      if (formData[key] != null) {
        if (
          (key === "attachment") &&
          formData[key] instanceof File
        ) {
          formDataToSend.append(key, formData[key], formData[key].name)
        } else {
          formDataToSend.append(key, formData[key])
        }
      }
    })
    try {
      const token = getToken()
      const response = await axiosInstance.post(`http://127.0.0.1:5000/complaints/add`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      toast.success("Complaint added successfully", {
        style: { background: "#E5E1DA", color: "#89A8B2" },
      })
      navigate(`/complaints/ticket/${response.data.ticket_number}`)
    } catch (error) {
      console.error("Failed to add complaint", error)
      toast.error("Failed to add complaint", {
        style: { background: "#F1F0E8", color: "#B3C8CF" },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomerSearch = async (searchTerm: string) => {
    try {
      const token = getToken()
      const response = await axiosInstance.get(
        `http://127.0.0.1:5000/complaints/search-customer?search_term=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      return response.data
    } catch (error) {
      console.error("Failed to search customer", error)
      toast.error("Failed to search customer", {
        style: { background: "#F1F0E8", color: "#B3C8CF" },
      })
      return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate("/complaint-management")}
          className="flex items-center text-[#89A8B2] hover:text-[#7A97A1] transition duration-300"
        >
          <FaArrowLeft className="mr-2" />
          Back to Complaints
        </button>
      </div>
      <h1 className="text-3xl font-bold text-center text-[#89A8B2] mb-8">Add New Complaint</h1>
      <div className="max-w-4xl mx-auto">
        <ComplaintForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
          handleSubmit={handleSubmit}
          isEditing={false}
          handleCustomerSearch={handleCustomerSearch}
          ticketNumber={null}
        />
      </div>
    </div>
  )
}

export default NewComplaintPage

