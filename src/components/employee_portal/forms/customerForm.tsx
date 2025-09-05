"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { getToken } from "../../../utils/auth.ts"
import axiosInstance from "../../../utils/axiosConfig.ts"
import { FaSpinner, FaMapMarkerAlt } from "react-icons/fa"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-geosearch/dist/geosearch.css"

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
  const [showMap, setShowMap] = useState(false)
  const mapRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken()
      try {
        const [areasResponse, servicePlansResponse, ispsResponse, inventoryResponse] = await Promise.all([
          axiosInstance.get("/areas/list", { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get("/service-plans/list", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axiosInstance.get("/isps/list", { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get("/inventory/list", { headers: { Authorization: `Bearer ${token}` } }),
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

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (!cleaned) return ''
    const withoutCountryCode = cleaned.startsWith('92') ? cleaned.slice(2) : cleaned
    const limited = withoutCountryCode.slice(0, 10)
    if (limited.length <= 3) {
      return `+92 (${limited}`
    } else if (limited.length <= 10) {
      return `+92 (${limited.slice(0, 3)})-${limited.slice(3)}`
    }
    return `+92 (${limited.slice(0, 3)})-${limited.slice(3, 10)}`
  }

  const memoizedHandleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      let formattedValue = value

      if (name === "cnic") {
        formattedValue = value.replace(/\D/g, "").slice(0, 13)
      } else if (name === "phone_1" || name === "phone_2") {
        if (value) {
          formattedValue = formatPhoneNumber(value)
        }
      }

      handleInputChange({
        target: {
          name,
          value: formattedValue,
        },
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)
    },
    [handleInputChange],
  )

  const memoizedHandleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileChange(e)
    },
    [handleFileChange],
  )

  const toggleMap = useCallback(() => {
    setShowMap((prev) => !prev)
  }, [])

  const MapEvents = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        handleInputChange({
          target: {
            name: "gps_coordinates",
            value: `${lat.toFixed(6)},${lng.toFixed(6)}`,
          },
        } as React.ChangeEvent<HTMLInputElement>)
        setShowMap(false)
      },
    })

    useEffect(() => {
      if (map) {
        const provider = new OpenStreetMapProvider()
        const searchControl = new GeoSearchControl({
          provider: provider,
          style: "bar",
          showMarker: true,
          showPopup: false,
          autoClose: true,
          retainZoomLevel: false,
          animateZoom: true,
          keepResult: false,
          searchLabel: "Enter address",
        })
        map.addControl(searchControl)

        return () => {
          map.removeControl(searchControl)
        }
      }
    }, [map])

    return null
  }

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
      <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-[#89A8B2] mb-1">
          {label}
        </label>
        {type === "select" ? (
          <select
            id={name}
            name={name}
            value={value || ""}
            onChange={onChange}
            required={required}
            className={`w-full p-2 border border-[#B3C8CF] rounded-md focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] ${className}`}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : name === "gps_coordinates" ? (
          <div className="relative">
            <input
              id={name}
              type={type}
              name={name}
              value={value || ""}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
              className={`w-full p-2 pr-10 border border-[#B3C8CF] rounded-md focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] ${className}`}
            />
            <button
              type="button"
              onClick={toggleMap}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#89A8B2] hover:text-[#B3C8CF] focus:outline-none"
            >
              <FaMapMarkerAlt className="w-5 h-5" />
            </button>
          </div>
        ) : (name === "phone_1" || name === "phone_2") ? (
          <input
            id={name}
            type="tel"
            name={name}
            value={value || ""}
            onChange={onChange}
            placeholder="+92 (xxx)-xxxxxxx"
            required={required}
            className={`w-full p-2 border border-[#B3C8CF] rounded-md focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] ${className}`}
            onKeyPress={(e) => {
              const pattern = /[\d\s()\-+]/
              if (!pattern.test(e.key)) {
                e.preventDefault()
              }
            }}
          />
        ) : (
          <input
            id={name}
            type={type}
            name={name}
            value={value || ""}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={`w-full p-2 border border-[#B3C8CF] rounded-md focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] ${className}`}
          />
        )}
      </div>
    ),
    [toggleMap],
  )

  const FileUploadField = useCallback(
    ({
      label,
      name,
      onChange,
      currentImage,
      currentDocument,
    }: {
      label: string
      name: string
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
      currentImage?: string
      currentDocument?: string
    }) => (
      <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-[#89A8B2] mb-1">
          {label}
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#B3C8CF] border-dashed rounded-md hover:border-[#89A8B2] transition-colors bg-[#F1F0E8]">
          <div className="space-y-1 text-center">
            <div className="flex text-sm text-[#89A8B2]">
              <input
                id={name}
                name={name}
                type="file"
                onChange={onChange}
                className="w-full text-sm text-[#89A8B2] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#B3C8CF] file:text-[#F1F0E8] hover:file:bg-[#89A8B2]"
                accept=".png,.jpg,.jpeg,.pdf"
              />
            </div>
            <p className="text-xs text-[#89A8B2]">PNG, JPG, JPEG, or PDF up to 10MB</p>
          </div>
        </div>
        {currentImage && (
          <div className="mt-4">
            <div className="relative w-full h-48 bg-[#E5E1DA] rounded-lg overflow-hidden">
              <img
                src={currentImage || "/placeholder.svg"}
                alt={`${label} preview`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
        {currentDocument && (
          <div className="mt-4">
            <a
              href={currentDocument}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#89A8B2] hover:text-[#B3C8CF] underline"
            >
              View current document
            </a>
          </div>
        )}
      </div>
    ),
    [],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#E5E1DA] to-[#F1F0E8]">
        <FaSpinner className="animate-spin text-[#89A8B2] text-4xl" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#F1F0E8] rounded-lg px-8 pt-6 pb-8 mb-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#89A8B2] mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Internet ID"
            name="internet_id"
            value={formData.internet_id || ""}
            onChange={memoizedHandleInputChange}
            placeholder="Enter Internet ID"
            required
          />
          <InputField
            label="First Name"
            name="first_name"
            value={formData.first_name || ""}
            onChange={memoizedHandleInputChange}
            placeholder="Enter first name"
            required
          />
          <InputField
            label="Last Name"
            name="last_name"
            value={formData.last_name || ""}
            onChange={memoizedHandleInputChange}
            placeholder="Enter last name"
            required
          />
          <InputField
            label="CNIC Number"
            name="cnic"
            value={formData.cnic || ""}
            onChange={memoizedHandleInputChange}
            placeholder="Enter 13-digit CNIC number"
            required
          />
          <InputField
            label="Phone 1"
            name="phone_1"
            type="tel"
            value={formData.phone_1 || ""}
            onChange={memoizedHandleInputChange}
            placeholder="92(xxx)xxx-xxxx"
            required
          />
          <InputField
            label="Whatsapp Number"
            name="phone_2"
            type="tel"
            value={formData.phone_2 || ""}
            onChange={memoizedHandleInputChange}
            placeholder="92(xxx)xxx-xxxx"
          />
          <InputField
            label="Email"
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={memoizedHandleInputChange}
            placeholder="Enter email address"
            required
          />
          <InputField
            label="Service Area"
            name="area_id"
            type="select"
            value={formData.area_id || ""}
            onChange={memoizedHandleInputChange}
            required
            options={areas.map((area: any) => ({ value: area.id, label: area.name }))}
          />
          <InputField
            label="Installation Address"
            name="installation_address"
            value={formData.installation_address || ""}
            onChange={memoizedHandleInputChange}
            placeholder="Enter installation address"
            required
          />
          <InputField
            label="GPS Coordinates"
            name="gps_coordinates"
            value={formData.gps_coordinates || ""}
            onChange={memoizedHandleInputChange}
            placeholder="Enter GPS coordinates"
          />
        </div>
      </div>

      {showMap && (
        <div className="mb-6">
          <MapContainer center={[0, 0]} zoom={2} style={{ height: "400px", width: "100%" }} ref={mapRef}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapEvents />
            {formData.gps_coordinates && (
              <Marker
                position={formData.gps_coordinates.split(",").map(Number)}
                icon={
                  new L.Icon({
                    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
                    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
                    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                  })
                }
              />
            )}
          </MapContainer>
        </div>
      )}

      <InputField
        label="ISP"
        name="isp_id"
        type="select"
        value={formData.isp_id || ""}
        onChange={memoizedHandleInputChange}
        required
        options={isps.map((isp: any) => ({ value: isp.id, label: isp.name }))}
      />
      <InputField
        label="Connection Type"
        name="connection_type"
        type="select"
        value={formData.connection_type || ""}
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
            value={formData.internet_connection_type || ""}
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
                value={formData.wire_length || ""}
                onChange={memoizedHandleInputChange}
                placeholder="Enter wire length"
                required
              />
              <InputField
                label="Wire Ownership"
                name="wire_ownership"
                type="select"
                value={formData.wire_ownership || ""}
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
                value={formData.router_ownership || ""}
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
                  value={formData.router_id || ""}
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
                  value={formData.router_serial_number || ""}
                  onChange={memoizedHandleInputChange}
                  placeholder="Enter router serial number"
                  required
                />
              )}
              <InputField
                label="Patch Cord Ownership"
                name="patch_cord_ownership"
                type="select"
                value={formData.patch_cord_ownership || ""}
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
                  value={formData.patch_cord_count || ""}
                  onChange={memoizedHandleInputChange}
                  placeholder="Enter number of patch cords"
                  required
                />
              )}
              <InputField
                label="Patch Cord Ethernet Ownership"
                name="patch_cord_ethernet_ownership"
                type="select"
                value={formData.patch_cord_ethernet_ownership || ""}
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
                  value={formData.patch_cord_ethernet_count || ""}
                  onChange={memoizedHandleInputChange}
                  placeholder="Enter number of patch cord ethernet"
                  required
                />
              )}
              <InputField
                label="Splicing Box Ownership"
                name="splicing_box_ownership"
                type="select"
                value={formData.splicing_box_ownership || ""}
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
                  value={formData.splicing_box_serial_number || ""}
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
                value={formData.ethernet_cable_ownership || ""}
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
                value={formData.ethernet_cable_length || ""}
                onChange={memoizedHandleInputChange}
                placeholder="Enter ethernet cable length"
                required
              />
              <InputField
                label="Dish Ownership"
                name="dish_ownership"
                type="select"
                value={formData.dish_ownership || ""}
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
                  value={formData.dish_id || ""}
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
                  value={formData.dish_mac_address || ""}
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
            value={formData.tv_cable_connection_type || ""}
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
              value={formData.node_count || ""}
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
                value={formData.node_count || ""}
                onChange={memoizedHandleInputChange}
                placeholder="Enter number of nodes"
                required
              />
              <InputField
                label="STB Serial Number"
                name="stb_serial_number"
                value={formData.stb_serial_number || ""}
                onChange={memoizedHandleInputChange}
                placeholder="Enter STB serial number"
                required
              />
            </>
          )}
        </>
      )}

      <InputField
        label="Package"
        name="service_plan_id"
        type="select"
        value={formData.service_plan_id || ""}
        onChange={memoizedHandleInputChange}
        required
        options={servicePlans.map((plan: any) => ({ value: plan.id, label: plan.name }))}
      />
      <InputField
        label="Discount Amount"
        name="discount_amount"
        type="number"
        value={formData.discount_amount || ""}
        onChange={memoizedHandleInputChange}
        placeholder="Enter discount amount"
      />
      <InputField
        label="Installation Date"
        name="installation_date"
        type="date"
        value={formData.installation_date || ""}
        onChange={memoizedHandleInputChange}
        required
      />
      <InputField
        label="Recharge Date"
        name="recharge_date"
        type="date"
        value={formData.recharge_date || ""}
        onChange={memoizedHandleInputChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileUploadField
          label="CNIC Front Image"
          name="cnic_front_image"
          onChange={memoizedHandleFileChange}
          currentImage={
            formData.cnic_front_image ? `/customers/cnic-front-image/${formData.id}` : undefined
          }
        />
        <FileUploadField
          label="CNIC Back Image"
          name="cnic_back_image"
          onChange={memoizedHandleFileChange}
          currentImage={
            formData.cnic_back_image ? `/customers/cnic-back-image/${formData.id}` : undefined
          }
        />
        <FileUploadField
          label="Agreement Document"
          name="agreement_document"
          onChange={memoizedHandleFileChange}
          currentDocument={
            formData.agreement_document
              ? `/customers/agreement-document/${formData.id}`
              : undefined
          }
        />
      </div>
    </form>
  )
}