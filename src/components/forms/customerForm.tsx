import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { FaSpinner, FaUser, FaNetworkWired, FaFileImage, FaBox, FaMoneyBillWave } from "react-icons/fa"

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
          axiosInstance.get("http://127.0.0.1:5000/areas/list", { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get("http://127.0.0.1:5000/service-plans/list", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axiosInstance.get("http://127.0.0.1:5000/isps/list", { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get("http://127.0.0.1:5000/inventory/list", { headers: { Authorization: `Bearer ${token}` } }),
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

  const memoizedHandleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.persist()
      handleInputChange(e)
    },
    [handleInputChange],
  )

  const memoizedHandleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.persist()
      handleFileChange(e)
    },
    [handleFileChange],
  )

  const memoizedHandleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      handleSubmit(e)
    },
    [handleSubmit],
  )

  const FormSection = useCallback(
    ({
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
    ),
    [],
  )

  const InputField = useCallback(
    ({
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
    ),
    [],
  )

  const FileUploadField = useCallback(
    ({
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
                src={currentImage || "/placeholder.svg"}
                alt={`${label} preview`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    ),
    [],
  )

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
            label="Whatsapp Number"
            name="phone_2"
            type="tel"
            value={formData.phone_2}
            onChange={memoizedHandleInputChange}
            placeholder="Enter whatsapp phone number"
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
          label="Connection Type"
          name="connection_type"
          type="select"
          value={formData.connection_type}
          onChange={memoizedHandleInputChange}
          required
          options={[
            { value: "internet", label: "Internet" },
            { value: "tv_cable", label: "TV Cable" },
            { value: "both", label: "Both" },
          ]}
        />
        {(formData.connection_type === "internet" || formData.connection_type === "both") && (
          <>
            <InputField
              label="Internet Connection Type"
              name="internet_connection_type"
              type="select"
              value={formData.internet_connection_type}
              onChange={memoizedHandleInputChange}
              required
              options={[
                { value: "wire", label: "Wire" },
                { value: "wireless", label: "Wireless" },
              ]}
            />
            {formData.internet_connection_type === "wire" && (
              <>
                <InputField
                  label="Wire Length (meters)"
                  name="wire_length"
                  type="number"
                  value={formData.wire_length}
                  onChange={memoizedHandleInputChange}
                  placeholder="Enter wire length"
                  required
                />
                <InputField
                  label="Wire Ownership"
                  name="wire_ownership"
                  type="select"
                  value={formData.wire_ownership}
                  onChange={memoizedHandleInputChange}
                  required
                  options={[
                    { value: "company", label: "Company" },
                    { value: "customer", label: "Customer" },
                  ]}
                />
                <InputField
                  label="Router Ownership"
                  name="router_ownership"
                  type="select"
                  value={formData.router_ownership}
                  onChange={memoizedHandleInputChange}
                  required
                  options={[
                    { value: "company", label: "Company" },
                    { value: "customer", label: "Customer" },
                  ]}
                />
                {formData.router_ownership === "company" && (
                  <InputField
                    label="Router"
                    name="router_id"
                    type="select"
                    value={formData.router_id}
                    onChange={memoizedHandleInputChange}
                    required
                    options={inventoryItems
                      .filter((item) => item.item_type === "router")
                      .map((item) => ({ value: item.id, label: `${item.name} - ${item.serial_number}` }))}
                  />
                )}
                {formData.router_ownership === "customer" && (
                  <InputField
                    label="Router Serial Number"
                    name="router_serial_number"
                    value={formData.router_serial_number}
                    onChange={memoizedHandleInputChange}
                    placeholder="Enter router serial number"
                    required
                  />
                )}
                <InputField
                  label="Patch Cord Ownership"
                  name="patch_cord_ownership"
                  type="select"
                  value={formData.patch_cord_ownership}
                  onChange={memoizedHandleInputChange}
                  required
                  options={[
                    { value: "company", label: "Company" },
                    { value: "customer", label: "Customer" },
                  ]}
                />
                {formData.patch_cord_ownership === "company" && (
                  <InputField
                    label="Number of Patch Cords"
                    name="patch_cord_count"
                    type="number"
                    value={formData.patch_cord_count}
                    onChange={memoizedHandleInputChange}
                    placeholder="Enter number of patch cords"
                    required
                  />
                )}
                <InputField
                  label="Patch Cord Ethernet Ownership"
                  name="patch_cord_ethernet_ownership"
                  type="select"
                  value={formData.patch_cord_ethernet_ownership}
                  onChange={memoizedHandleInputChange}
                  required
                  options={[
                    { value: "company", label: "Company" },
                    { value: "customer", label: "Customer" },
                  ]}
                />
                {formData.patch_cord_ethernet_ownership === "company" && (
                  <InputField
                    label="Number of Patch Cord Ethernet"
                    name="patch_cord_ethernet_count"
                    type="number"
                    value={formData.patch_cord_ethernet_count}
                    onChange={memoizedHandleInputChange}
                    placeholder="Enter number of patch cord ethernet"
                    required
                  />
                )}
                <InputField
                  label="Splicing Box Ownership"
                  name="splicing_box_ownership"
                  type="select"
                  value={formData.splicing_box_ownership}
                  onChange={memoizedHandleInputChange}
                  required
                  options={[
                    { value: "company", label: "Company" },
                    { value: "customer", label: "Customer" },
                  ]}
                />
                {formData.splicing_box_ownership === "company" && (
                  <InputField
                    label="Splicing Box Serial Number"
                    name="splicing_box_serial_number"
                    value={formData.splicing_box_serial_number}
                    onChange={memoizedHandleInputChange}
                    placeholder="Enter splicing box serial number"
                    required
                  />
                )}
              </>
            )}
            {formData.internet_connection_type === "wireless" && (
              <>
                <InputField
                  label="Ethernet Cable Ownership"
                  name="ethernet_cable_ownership"
                  type="select"
                  value={formData.ethernet_cable_ownership}
                  onChange={memoizedHandleInputChange}
                  required
                  options={[
                    { value: "company", label: "Company" },
                    { value: "customer", label: "Customer" },
                  ]}
                />
                <InputField
                  label="Ethernet Cable Length (feet)"
                  name="ethernet_cable_length"
                  type="number"
                  value={formData.ethernet_cable_length}
                  onChange={memoizedHandleInputChange}
                  placeholder="Enter ethernet cable length"
                  required
                />
                <InputField
                  label="Dish Ownership"
                  name="dish_ownership"
                  type="select"
                  value={formData.dish_ownership}
                  onChange={memoizedHandleInputChange}
                  required
                  options={[
                    { value: "company", label: "Company" },
                    { value: "customer", label: "Customer" },
                  ]}
                />
                {formData.dish_ownership === "company" && (
                  <InputField
                    label="Dish"
                    name="dish_id"
                    type="select"
                    value={formData.dish_id}
                    onChange={memoizedHandleInputChange}
                    required
                    options={inventoryItems
                      .filter((item) => item.item_type === "dish")
                      .map((item) => ({ value: item.id, label: `${item.name} - ${item.serial_number}` }))}
                  />
                )}
                {formData.dish_ownership === "customer" && (
                  <InputField
                    label="Dish MAC Address"
                    name="dish_mac_address"
                    value={formData.dish_mac_address}
                    onChange={memoizedHandleInputChange}
                    placeholder="Enter dish MAC address"
                    required
                  />
                )}
              </>
            )}
          </>
        )}
        {(formData.connection_type === "tv_cable" || formData.connection_type === "both") && (
          <>
            <InputField
              label="TV Cable Connection Type"
              name="tv_cable_connection_type"
              type="select"
              value={formData.tv_cable_connection_type}
              onChange={memoizedHandleInputChange}
              required
              options={[
                { value: "analog", label: "Analog" },
                { value: "digital", label: "Digital" },
              ]}
            />
            {formData.tv_cable_connection_type === "analog" && (
              <InputField
                label="Number of Nodes"
                name="node_count"
                type="number"
                value={formData.node_count}
                onChange={memoizedHandleInputChange}
                placeholder="Enter number of nodes"
                required
              />
            )}
            {formData.tv_cable_connection_type === "digital" && (
              <>
                <InputField
                  label="Number of Nodes"
                  name="node_count"
                  type="number"
                  value={formData.node_count}
                  onChange={memoizedHandleInputChange}
                  placeholder="Enter number of nodes"
                  required
                />
                <InputField
                  label="STB Serial Number"
                  name="stb_serial_number"
                  value={formData.stb_serial_number}
                  onChange={memoizedHandleInputChange}
                  placeholder="Enter STB serial number"
                  required
                />
              </>
            )}
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

      <FormSection title="Miscellaneous" icon={FaBox}>
        <InputField
          label="Miscellaneous Details"
          name="miscellaneous_details"
          value={formData.miscellaneous_details}
          onChange={memoizedHandleInputChange}
          placeholder="Enter any additional details"
        />
        <InputField
          label="Miscellaneous Charges"
          name="miscellaneous_charges"
          type="number"
          value={formData.miscellaneous_charges}
          onChange={memoizedHandleInputChange}
          placeholder="Enter any additional charges"
        />
      </FormSection>

      <FormSection title="Documentation" icon={FaFileImage}>
        <FileUploadField
          label="CNIC Front Image"
          name="cnic_front_image"
          onChange={memoizedHandleFileChange}
          currentImage={
            formData.cnic_front_image ? `http://127.0.0.1:5000/customers/cnic-front-image/${formData.id}` : undefined
          }
        />
        <FileUploadField
          label="CNIC Back Image"
          name="cnic_back_image"
          onChange={memoizedHandleFileChange}
          currentImage={
            formData.cnic_back_image ? `http://127.0.0.1:5000/customers/cnic-back-image/${formData.id}` : undefined
          }
        />
      </FormSection>
    </form>
  )
}

