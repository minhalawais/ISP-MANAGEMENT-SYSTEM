import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import {
  FaSpinner,
  FaUser,
  FaNetworkWired,
  FaCreditCard,
  FaFileImage,
  FaBox,
  FaTv,
  FaMoneyBillWave,
} from "react-icons/fa"

interface CustomerFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isEditing: boolean
}

interface InventoryItem {
  id: string
  name: string
  serial_number: string
  is_splitter: boolean
  splitter_number?: string
  item_type: string
}

export function CustomerForm({
  formData,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  isEditing,
}: CustomerFormProps) {
  const [areas, setAreas] = useState([])
  const [servicePlans, setServicePlans] = useState([])
  const [isps, setIsps] = useState([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken()
      try {
        const [areasResponse, servicePlansResponse, ispsResponse, inventoryResponse] = await Promise.all([
          axiosInstance.get("https://mbanet.com.pk/api/areas/list", { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get("https://mbanet.com.pk/api/service-plans/list", { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get("https://mbanet.com.pk/api/isps/list", { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get("https://mbanet.com.pk/api/inventory/list", { headers: { Authorization: `Bearer ${token}` } }),
        ])
        setAreas(areasResponse.data)
        setServicePlans(servicePlansResponse.data)
        setIsps(ispsResponse.data)
        setInventoryItems(inventoryResponse.data)
      } catch (error) {
        console.error("Failed to fetch data", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const memoizedHandleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.persist()
    handleInputChange(e)
  }, [handleInputChange])

  const memoizedHandleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist()
    handleFileChange(e)
  }, [handleFileChange])

  const memoizedHandleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSubmit(e)
  }, [handleSubmit])

  const FormSection = useCallback(({
    title,
    icon: Icon,
    children,
  }: {
    title: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
  }) => (
    <div className="bg-white/90 p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 mb-6">
      <div className="flex items-center mb-4 space-x-3">
        <Icon className="text-purple-600 text-2xl" />
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  ), [])

  const InputField = useCallback(({
    label,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    className = "",
    options = [],
  }: {
    label: string
    name: string
    type?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
    placeholder?: string
    required?: boolean
    className?: string
    options?: { value: string; label: string }[]
  }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {type === "select" ? (
        <select
          id={name}
          name={name}
          value={value || ""}
          onChange={onChange}
          required={required}
          className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${className}`}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${className}`}
        />
      )}
    </div>
  ), [])

  const FileUploadField = useCallback(({
    label,
    name,
    onChange,
    currentImage,
  }: {
    label: string
    name: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    currentImage?: string
  }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-purple-500 transition-colors">
        <div className="space-y-1 text-center">
          <div className="flex text-sm text-gray-600">
            <input
              id={name}
              name={name}
              type="file"
              onChange={onChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100"
              accept=".png,.jpg,.jpeg"
            />
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, or JPEG up to 10MB</p>
        </div>
      </div>
      {currentImage && (
        <div className="mt-4">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={currentImage}
              alt={`${label} preview`}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  ), [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
      </div>
    )
  }

  return (
    <form onSubmit={memoizedHandleSubmit} className="min-h-screen space-y-6 p-6">
      <FormSection title="Personal Information" icon={FaUser}>
        <InputField
          label="Internet ID"
          name="internet_id"
          value={formData.internet_id}
          onChange={memoizedHandleInputChange}
          placeholder="Enter Internet ID"
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={memoizedHandleInputChange}
            placeholder="Enter first name"
            required
          />
          <InputField
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={memoizedHandleInputChange}
            placeholder="Enter last name"
            required
          />
        </div>
        <InputField
          label="CNIC Number"
          name="cnic"
          value={formData.cnic}
          onChange={memoizedHandleInputChange}
          placeholder="Enter CNIC number (e.g., 42201-1234567-1)"
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Phone 1"
            name="phone_1"
            type="tel"
            value={formData.phone_1}
            onChange={memoizedHandleInputChange}
            placeholder="Enter primary phone number"
            required
          />
          <InputField
            label="Phone 2"
            name="phone_2"
            type="tel"
            value={formData.phone_2}
            onChange={memoizedHandleInputChange}
            placeholder="Enter secondary phone number"
          />
        </div>
        <InputField
          key="email"
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={memoizedHandleInputChange}
          placeholder="Enter email address"
          required
        />
      </FormSection>

      <FormSection title="Location Details" icon={FaNetworkWired}>
        <InputField
          label="Service Area"
          name="area_id"
          type="select"
          value={formData.area_id}
          onChange={memoizedHandleInputChange}
          required
          options={areas.map((area: any) => ({ value: area.id, label: area.name }))}
        />
        <InputField
          label="Installation Address"
          name="installation_address"
          value={formData.installation_address}
          onChange={memoizedHandleInputChange}
          placeholder="Enter installation address"
          required
        />
      </FormSection>

      <FormSection title="Service Details" icon={FaBox}>
        <InputField
          label="ISP"
          name="isp_id"
          type="select"
          value={formData.isp_id}
          onChange={memoizedHandleInputChange}
          required
          options={isps.map((isp: any) => ({ value: isp.id, label: isp.name }))}
        />
        <InputField
          label="Splitter Number"
          name="splitter_id"
          type="select"
          value={formData.splitter_id}
          onChange={memoizedHandleInputChange}
          required
          options={inventoryItems
            .filter((item) => item.is_splitter)
            .map((splitter) => ({
              value: splitter.id,
              label: `${splitter.splitter_number} - ${splitter.serial_number}`,
            }))}
        />
        <InputField
          label="Equipment Owned By"
          name="equipment_owned_by"
          type="select"
          value={formData.equipment_owned_by}
          onChange={memoizedHandleInputChange}
          required
          options={[
            { value: "customer", label: "Customer" },
            { value: "company", label: "Company" },
          ]}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Connection Type</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="connection_type"
                value="wire"
                checked={formData.connection_type === "wire"}
                onChange={memoizedHandleInputChange}
                className="form-radio text-purple-600"
              />
              <span className="ml-2">Wire</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="connection_type"
                value="wireless"
                checked={formData.connection_type === "wireless"}
                onChange={memoizedHandleInputChange}
                className="form-radio text-purple-600"
              />
              <span className="ml-2">Wireless</span>
            </label>
          </div>
        </div>
        {formData.connection_type === "wire" && (
          <InputField
            label="Wire Length (meters)"
            name="wire_length"
            type="number"
            value={formData.wire_length}
            onChange={memoizedHandleInputChange}
            placeholder="Enter wire length"
          />
        )}
        {formData.equipment_owned_by === "company" && (
          <>
            <InputField
              label="Router"
              name="router_id"
              type="select"
              value={formData.router_id}
              onChange={memoizedHandleInputChange}
              options={inventoryItems
                .filter((item) => item.item_type === "router")
                .map((item) => ({ value: item.id, label: `${item.name} - ${item.serial_number}` }))}
            />
            <InputField
              label="Patch Cord"
              name="patch_cord_id"
              type="select"
              value={formData.patch_cord_id}
              onChange={memoizedHandleInputChange}
              options={inventoryItems
                .filter((item) => item.item_type === "cable")
                .map((item) => ({ value: item.id, label: `${item.name} - ${item.serial_number}` }))}
            />
            <InputField
              label="Splicing Box"
              name="splicing_box_id"
              type="select"
              value={formData.splicing_box_id}
              onChange={memoizedHandleInputChange}
              options={inventoryItems
                .filter((item) => item.item_type === "patch_panel")
                .map((item) => ({ value: item.id, label: `${item.name} - ${item.serial_number}` }))}
            />
          </>
        )}
            {formData.connection_type === "wireless" && (
              <>
                <InputField
                  label="Ethernet Cable"
                  name="ethernet_cable_id"
                  type="select"
                  value={formData.ethernet_cable_id}
                  onChange={memoizedHandleInputChange}
                  options={inventoryItems
                    .filter((item) => item.item_type === "cable")
                    .map((item) => ({ value: item.id, label: `${item.name} - ${item.serial_number}` }))}
                />
                <InputField
                  label="Dish"
                  name="dish_id"
                  type="select"
                  value={formData.dish_id}
                  onChange={memoizedHandleInputChange}
                  options={inventoryItems
                    .filter((item) => item.item_type === "other")
                    .map((item) => ({ value: item.id, label: `${item.name} - ${item.serial_number}` }))}
                />
          </>
        )}
      </FormSection>

      <FormSection title="TV Cable" icon={FaTv}>
        <InputField
          label="TV Cable Type"
          name="tv_cable_type"
          type="select"
          value={formData.tv_cable_type}
          onChange={memoizedHandleInputChange}
          options={[
            { value: "analog", label: "Analog" },
            { value: "digital", label: "Digital" },
          ]}
        />
        {formData.tv_cable_type === "analog" && (
          <InputField
            label="Node"
            name="node_id"
            type="select"
            value={formData.node_id}
            onChange={memoizedHandleInputChange}
            options={inventoryItems
              .filter((item) => item.item_type === "other")
              .map((item) => ({ value: item.id, label: `${item.name} - ${item.serial_number}` }))}
          />
        )}
        {formData.tv_cable_type === "digital" && (
          <>
            <InputField
              label="Node"
              name="node_id"
              type="select"
              value={formData.node_id}
              onChange={memoizedHandleInputChange}
              options={inventoryItems
                .filter((item) => item.item_type === "other")
                .map((item) => ({ value: item.id, label: `${item.name} - ${item.serial_number}` }))}
            />
            <InputField
              label="STB"
              name="stb_id"
              type="select"
              value={formData.stb_id}
              onChange={memoizedHandleInputChange}
              options={inventoryItems
                .filter((item) => item.item_type === "other")
                .map((item) => ({ value: item.id, label: `${item.name} - ${item.serial_number}` }))}
            />
          </>
        )}
      </FormSection>

      <FormSection title="Package and Billing" icon={FaMoneyBillWave}>
        <InputField
          label="Package"
          name="service_plan_id"
          type="select"
          value={formData.service_plan_id}
          onChange={memoizedHandleInputChange}
          required
          options={servicePlans.map((plan: any) => ({ value: plan.id, label: plan.name }))}
        />
        <InputField
          label="Discount Amount"
          name="discount_amount"
          type="number"
          value={formData.discount_amount}
          onChange={memoizedHandleInputChange}
          placeholder="Enter discount amount"
        />
        <InputField
          label="Installation Date"
          name="installation_date"
          type="date"
          value={formData.installation_date}
          onChange={memoizedHandleInputChange}
          required
        />
        <InputField
          label="Recharge Date"
          name="recharge_date"
          type="date"
          value={formData.recharge_date}
          onChange={memoizedHandleInputChange}
        />
      </FormSection>

      <FormSection title="Documentation" icon={FaFileImage}>
        <FileUploadField
          label="CNIC Front Image"
          name="cnic_front_image"
          onChange={memoizedHandleFileChange}
          currentImage={
            formData.cnic_front_image
              ? `https://mbanet.com.pk/api/customers/cnic-front-image/${formData.id}`
              : undefined
          }
        />
        <FileUploadField
          label="CNIC Back Image"
          name="cnic_back_image"
          onChange={memoizedHandleFileChange}
          currentImage={
            formData.cnic_back_image
              ? `https://mbanet.com.pk/api/customers/cnic-back-image/${formData.id}`
              : undefined
          }
        />
      </FormSection>

    </form>
  )
}