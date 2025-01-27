import type React from "react"
import { FaBuilding, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa"

interface ISPFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  isEditing: boolean
}

export const ISPForm: React.FC<ISPFormProps> = ({ formData, handleInputChange, isEditing }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FaBuilding className="text-purple-600" />
        <input
          type="text"
          name="name"
          value={formData.name || ""}
          onChange={handleInputChange}
          placeholder="ISP Name"
          className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <FaUser className="text-purple-600" />
        <input
          type="text"
          name="contact_person"
          value={formData.contact_person || ""}
          onChange={handleInputChange}
          placeholder="Contact Person"
          className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <FaEnvelope className="text-purple-600" />
        <input
          type="email"
          name="email"
          value={formData.email || ""}
          onChange={handleInputChange}
          placeholder="Email"
          className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <FaPhone className="text-purple-600" />
        <input
          type="tel"
          name="phone"
          value={formData.phone || ""}
          onChange={handleInputChange}
          placeholder="Phone"
          className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
          required
        />
      </div>

      <div className="flex items-start space-x-2">
        <FaMapMarkerAlt className="text-purple-600 mt-2" />
        <textarea
          name="address"
          value={formData.address || ""}
          onChange={handleInputChange}
          placeholder="Address"
          className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
          rows={3}
          required
        />
      </div>
    </div>
  )
}

