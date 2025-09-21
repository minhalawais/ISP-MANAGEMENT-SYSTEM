"use client"

import React from "react"

import type { ReactElement } from "react"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-geosearch/dist/geosearch.css"
import {
  MapPin,
  Phone,
  Calendar,
  User,
  Mail,
  Hash,
  Home,
  Globe,
  Wifi,
  Router,
  Box,
  Tv,
  Package,
  DollarSign,
  Loader,
  XCircle,
  CheckCircle2,
} from "lucide-react"
import { FileUploadField } from "./FileUploadField.tsx"

interface CustomerFormProps {
  formData: Partial<Customer>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  isEditing: boolean
  validationErrors?: Record<string, string>
}

interface Customer {
  first_name: string
  last_name: string
  email: string
  internet_id: string
  phone_1: string
  phone_2?: string
  installation_address: string
  gps_coordinates?: string
  cnic: string
  area_id: string
  service_plan_id: string
  isp_id: string
  connection_type: string
  internet_connection_type?: string
  wire_length?: string
  wire_ownership?: string
  router_ownership?: string
  router_id?: string
  router_serial_number?: string
  patch_cord_ownership?: string
  patch_cord_count?: string
  patch_cord_ethernet_ownership?: string
  patch_cord_ethernet_count?: string
  splicing_box_ownership?: string
  splicing_box_serial_number?: string
  tv_cable_connection_type?: string
  node_count?: string
  stb_serial_number?: string
  cnic_front_image?: string
  cnic_back_image?: string
  agreement_document?: string
  discount_amount?: string
  installation_date: string
  recharge_date?: string
}

interface Area {
  id: string
  name: string
}

interface ServicePlan {
  id: string
  name: string
}

interface ISP {
  id: string
  name: string
}

interface InventoryItem {
  id: string
  name: string
  serial_number: string
  is_splitter: boolean
  splitter_number?: string
  item_type: string
}

interface InputFieldProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  placeholder?: string
  required?: boolean
  className?: string
  options?: { value: string; label: string }[]
  icon?: ReactElement
  showInternetIdStatus?: boolean
  internetIdStatus?: {
    checking: boolean
    available: boolean | null
    message: string
  }
  cnicStatus?: {
    checking: boolean
    available: boolean | null
    message: string
  }
  submitErrors?: Record<string, string>
  toggleMap?: () => void
  validationErrors?: Record<string, string>
}

const InputField = React.memo(
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
    icon,
    showInternetIdStatus = false,
    internetIdStatus,
    cnicStatus,
    submitErrors,
    toggleMap,
    validationErrors,
  }: InputFieldProps) => (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-slate-gray mb-1">
        {label}
      </label>
      <div className="relative">
        {type === "select" ? (
          <>
            {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
            <select
              id={name}
              name={name}
              value={value || ""}
              onChange={onChange}
              required={required}
              className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-2.5 border ${
                submitErrors?.[name] || validationErrors?.[name] ? "border-coral-red" : "border-slate-gray/30"
              } rounded-lg shadow-sm focus:ring-2 focus:ring-electric-blue focus:border-transparent bg-white text-slate-gray appearance-none ${className}`}
            >
              <option value="">Select {label}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-slate-gray/70" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </>
        ) : name === "gps_coordinates" ? (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-slate-gray/70" />
            </div>
            <input
              id={name}
              type={type}
              name={name}
              value={value || ""}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
              className={`w-full pl-10 pr-10 py-2.5 border border-slate-gray/30 rounded-lg shadow-sm 
                     focus:ring-2 focus:ring-electric-blue focus:border-transparent bg-white 
                     text-slate-gray placeholder-slate-gray/50 ${className}`}
            />
            <button
              type="button"
              onClick={toggleMap}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-electric-blue hover:text-deep-ocean transition-colors p-1 rounded-full hover:bg-light-sky"
            >
              <Globe className="w-5 h-5" />
            </button>
          </div>
        ) : name === "phone_1" || name === "phone_2" ? (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-slate-gray/70" />
            </div>
            <input
              id={name}
              type="tel"
              name={name}
              value={value || ""}
              onChange={onChange}
              placeholder="+92 (xxx)-xxxxxxx"
              required={required}
              className={`w-full pl-10 pr-4 py-2.5 border border-slate-gray/30 rounded-lg shadow-sm 
                     focus:ring-2 focus:ring-electric-blue focus:border-transparent bg-white 
                     text-slate-gray placeholder-slate-gray/50 ${className}`}
              onKeyPress={(e) => {
                const pattern = /[\d\s()\-+]/
                if (!pattern.test(e.key)) {
                  e.preventDefault()
                }
              }}
            />
          </div>
        ) : (
          <>
            {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
            <input
              id={name}
              type={type}
              name={name}
              value={value || ""}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
              className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-2.5 border ${
                submitErrors?.[name] || validationErrors?.[name] ? "border-coral-red" : "border-slate-gray/30"
              } rounded-lg shadow-sm focus:ring-2 focus:ring-electric-blue focus:border-transparent bg-white text-slate-gray placeholder-slate-gray/50 ${className}`}
            />
            {((showInternetIdStatus && name === "internet_id") || name === "cnic") && value && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                {name === "internet_id" && internetIdStatus?.checking ? (
                  <Loader className="h-5 w-5 animate-spin text-slate-gray/70" />
                ) : name === "cnic" && cnicStatus?.checking ? (
                  <Loader className="h-5 w-5 animate-spin text-slate-gray/70" />
                ) : name === "internet_id" && internetIdStatus?.available !== null ? (
                  internetIdStatus?.available ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-green" />
                  ) : (
                    <XCircle className="h-5 w-5 text-coral-red" />
                  )
                ) : name === "cnic" && cnicStatus?.available !== null ? (
                  cnicStatus?.available ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-green" />
                  ) : (
                    <XCircle className="h-5 w-5 text-coral-red" />
                  )
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
      {(submitErrors?.[name] || validationErrors?.[name]) && (
        <p className="text-coral-red text-sm mt-1 flex items-center gap-1">
          <XCircle className="h-4 w-4" />
          {submitErrors[name] || validationErrors[name]}
        </p>
      )}
    </div>
  ),
)

InputField.displayName = "InputField"

export function CustomerForm({
  formData,
  handleInputChange,
  handleFileChange,
  isEditing,
  validationErrors = {},
}: CustomerFormProps) {
  const [areas, setAreas] = useState<Area[]>([])
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([])
  const [isps, setIsps] = useState<ISP[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showMap, setShowMap] = useState(false)
  const [internetIdStatus, setInternetIdStatus] = useState<{
    checking: boolean
    available: boolean | null
    message: string
  }>({ checking: false, available: null, message: "" })
  const [cnicStatus, setCnicStatus] = useState<{
    checking: boolean
    available: boolean | null
    message: string
  }>({ checking: false, available: null, message: "" })
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({})
  const mapRef = useRef(null)
  const internetIdCheckTimeout = useRef<NodeJS.Timeout | null>(null)
  const cnicCheckTimeout = useRef<NodeJS.Timeout | null>(null)
  console.log("formData:", formData)

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
        console.log("inventoryResponse", inventoryResponse.data)
        setInventoryItems(inventoryResponse.data)
      } catch (error) {
        console.error("Failed to fetch data", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setSubmitErrors((prev) => ({ ...prev, ...validationErrors }))
    }
  }, [validationErrors])

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (!cleaned) return ""
    const withoutCountryCode = cleaned.startsWith("92") ? cleaned.slice(2) : cleaned
    const limited = withoutCountryCode.slice(0, 10)
    if (limited.length <= 3) {
      return `+92 (${limited}`
    } else if (limited.length <= 10) {
      return `+92 (${limited.slice(0, 3)})-${limited.slice(3)}`
    }
    return `+92 (${limited.slice(0, 3)})-${limited.slice(3, 10)}`
  }

  const checkInternetIdAvailability = useCallback(
    async (internetId: string) => {
      if (!internetId || internetId.length < 3) {
        setInternetIdStatus({ checking: false, available: null, message: "" })
        return
      }

      if (isEditing && formData.internet_id === internetId) {
        setInternetIdStatus({ checking: false, available: true, message: "Current Internet ID" })
        return
      }

      setInternetIdStatus((prev) =>
        prev.checking ? prev : { checking: true, available: null, message: "Checking availability..." },
      )

      if (internetIdCheckTimeout.current) {
        clearTimeout(internetIdCheckTimeout.current)
      }

      internetIdCheckTimeout.current = setTimeout(async () => {
        try {
          const token = getToken()
          const response = await axiosInstance.get(`/customers/check-internet-id/${internetId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          setInternetIdStatus({
            checking: false,
            available: response.data.available,
            message: response.data.available ? "Internet ID is available" : "Internet ID is already taken",
          })
        } catch (error) {
          setInternetIdStatus({
            checking: false,
            available: null,
            message: "Error checking availability",
          })
        }
      }, 500)
    },
    [isEditing, formData.internet_id],
  )

  const checkCnicAvailability = useCallback(
    async (cnic: string) => {
      if (!cnic || cnic.length < 13) {
        setCnicStatus({ checking: false, available: null, message: "" })
        return
      }

      if (isEditing && formData.cnic === cnic) {
        setCnicStatus({ checking: false, available: true, message: "Current CNIC" })
        return
      }

      setCnicStatus((prev) =>
        prev.checking ? prev : { checking: true, available: null, message: "Checking CNIC availability..." },
      )

      if (cnicCheckTimeout.current) {
        clearTimeout(cnicCheckTimeout.current)
      }

      cnicCheckTimeout.current = setTimeout(async () => {
        try {
          const token = getToken()
          const response = await axiosInstance.get(`/customers/check-cnic/${cnic}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          setCnicStatus({
            checking: false,
            available: response.data.available,
            message: response.data.available ? "CNIC is available" : "CNIC is already registered",
          })
        } catch (error) {
          setCnicStatus({
            checking: false,
            available: null,
            message: "Error checking CNIC availability",
          })
        }
      }, 500)
    },
    [isEditing, formData.cnic],
  )

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

      if (name === "internet_id") {
        checkInternetIdAvailability(formattedValue)
      }

      if (name === "cnic") {
        checkCnicAvailability(formattedValue)
      }

      if (submitErrors[name]) {
        setSubmitErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }

      if (validationErrors && validationErrors[name]) {
        // This will be handled by the parent component
      }
    },
    [handleInputChange, checkInternetIdAvailability, checkCnicAvailability, submitErrors, validationErrors],
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

  const inputFieldProps = useMemo(
    () => ({
      internetIdStatus,
      cnicStatus,
      submitErrors,
      toggleMap,
      validationErrors,
    }),
    [internetIdStatus, cnicStatus, submitErrors, toggleMap, validationErrors],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-light-sky/50 to-white">
        <div className="text-center">
          <Loader className="animate-spin text-electric-blue text-4xl mx-auto mb-4" />
          <p className="text-slate-gray">Loading customer data...</p>
        </div>
      </div>
    )
  }

  return (
    <form className="bg-white rounded-xl px-8 pt-6 pb-8 mb-4 shadow-sm">
      {(submitErrors.general || submitErrors.error) && (
        <div className="mb-6 p-4 bg-coral-red/10 border border-coral-red/20 rounded-lg">
          <p className="text-coral-red flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            {submitErrors.general || submitErrors.error}
          </p>
        </div>
      )}

      <InputField
        label="Internet ID"
        name="internet_id"
        value={formData.internet_id || ""}
        onChange={memoizedHandleInputChange}
        placeholder="Enter Internet ID"
        required
        icon={<Hash className="h-5 w-5 text-slate-gray/70" />}
        showInternetIdStatus={true}
        internetIdStatus={internetIdStatus}
        validationErrors={validationErrors}
        {...inputFieldProps}
      />

      <InputField
        label="First Name"
        name="first_name"
        value={formData.first_name || ""}
        onChange={memoizedHandleInputChange}
        placeholder="Enter first name"
        required
        icon={<User className="h-5 w-5 text-slate-gray/70" />}
        {...inputFieldProps}
      />

      <InputField
        label="Last Name"
        name="last_name"
        value={formData.last_name || ""}
        onChange={memoizedHandleInputChange}
        placeholder="Enter last name"
        required
        icon={<User className="h-5 w-5 text-slate-gray/70" />}
        {...inputFieldProps}
      />

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Hash className="h-5 w-5 text-slate-gray/70" />
          </div>
          <InputField
            label="CNIC Number"
            name="cnic"
            value={formData.cnic || ""}
            onChange={memoizedHandleInputChange}
            placeholder="Enter 13-digit CNIC number"
            required
            icon={<Hash className="h-5 w-5 text-slate-gray/70" />}
            showInternetIdStatus={true}
            internetIdStatus={cnicStatus}
            validationErrors={validationErrors}
            {...inputFieldProps}
          />
        </div>
        {(submitErrors?.cnic || validationErrors?.cnic) && (
          <p className="text-coral-red text-sm mt-1 flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            {submitErrors.cnic || validationErrors.cnic}
          </p>
        )}
      </div>

      <InputField
        label="Phone 1"
        name="phone_1"
        type="tel"
        value={formData.phone_1 || ""}
        onChange={memoizedHandleInputChange}
        placeholder="92(xxx)xxx-xxxx"
        required
        {...inputFieldProps}
      />

      <InputField
        label="Whatsapp Number"
        name="phone_2"
        type="tel"
        value={formData.phone_2 || ""}
        onChange={memoizedHandleInputChange}
        placeholder="92(xxx)xxx-xxxx"
        {...inputFieldProps}
      />

      <InputField
        label="Email"
        name="email"
        type="email"
        value={formData.email || ""}
        onChange={memoizedHandleInputChange}
        placeholder="Enter email address"
        required
        icon={<Mail className="h-5 w-5 text-slate-gray/70" />}
        {...inputFieldProps}
      />

      <InputField
        label="Service Area"
        name="area_id"
        type="select"
        value={formData.area_id || ""}
        onChange={memoizedHandleInputChange}
        required
        options={areas.map((area: Area) => ({ value: area.id, label: area.name }))}
        icon={<MapPin className="h-5 w-5 text-slate-gray/70" />}
        {...inputFieldProps}
      />

      <InputField
        label="Installation Address"
        name="installation_address"
        value={formData.installation_address || ""}
        onChange={memoizedHandleInputChange}
        placeholder="Enter installation address"
        required
        icon={<Home className="h-5 w-5 text-slate-gray/70" />}
        {...inputFieldProps}
      />

      <InputField
        label="GPS Coordinates"
        name="gps_coordinates"
        value={formData.gps_coordinates || ""}
        onChange={memoizedHandleInputChange}
        placeholder="Enter GPS coordinates"
        {...inputFieldProps}
      />

      {showMap && (
        <div className="mb-6 rounded-lg overflow-hidden shadow-md border border-slate-gray/20">
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

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-deep-ocean mb-6 border-b border-slate-gray/10 pb-2">
          Service Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="ISP"
            name="isp_id"
            type="select"
            value={formData.isp_id || ""}
            onChange={memoizedHandleInputChange}
            required
            options={isps.map((isp: ISP) => ({ value: isp.id, label: isp.name }))}
            icon={<Globe className="h-5 w-5 text-slate-gray/70" />}
            {...inputFieldProps}
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
            icon={<Wifi className="h-5 w-5 text-slate-gray/70" />}
            {...inputFieldProps}
          />
        </div>
      </div>

      {(formData.connection_type === "internet" || formData.connection_type === "both") && (
        <div className="mb-6 bg-light-sky/20 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-deep-ocean mb-4">Internet Connection Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              icon={<Wifi className="h-5 w-5 text-slate-gray/70" />}
              {...inputFieldProps}
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
                  icon={<Box className="h-5 w-5 text-slate-gray/70" />}
                  {...inputFieldProps}
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
                  icon={<User className="h-5 w-5 text-slate-gray/70" />}
                  {...inputFieldProps}
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
                  icon={<Router className="h-5 w-5 text-slate-gray/70" />}
                  {...inputFieldProps}
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
                      .filter((item) => item.item_type === "Router")
                      .map((item) => ({
                        value: item.id,
                        label: `${item.item_type} - ${item.serial_number || "No Serial"}`,
                      }))}
                    icon={<Router className="h-5 w-5 text-slate-gray/70" />}
                    {...inputFieldProps}
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
                    icon={<Hash className="h-5 w-5 text-slate-gray/70" />}
                    {...inputFieldProps}
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
                  icon={<User className="h-5 w-5 text-slate-gray/70" />}
                  {...inputFieldProps}
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
                    icon={<Hash className="h-5 w-5 text-slate-gray/70" />}
                    {...inputFieldProps}
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
                  icon={<User className="h-5 w-5 text-slate-gray/70" />}
                  {...inputFieldProps}
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
                    icon={<Hash className="h-5 w-5 text-slate-gray/70" />}
                    {...inputFieldProps}
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
                  icon={<User className="h-5 w-5 text-slate-gray/70" />}
                  {...inputFieldProps}
                />
                {formData.splicing_box_ownership === "company" && (
                  <InputField
                    label="Splicing Box Serial Number"
                    name="splicing_box_serial_number"
                    value={formData.splicing_box_serial_number || ""}
                    onChange={memoizedHandleInputChange}
                    placeholder="Enter splicing box serial number"
                    required
                    icon={<Hash className="h-5 w-5 text-slate-gray/70" />}
                    {...inputFieldProps}
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
                  icon={<User className="h-5 w-5 text-slate-gray/70" />}
                  {...inputFieldProps}
                />
                <InputField
                  label="Ethernet Cable Length (feet)"
                  name="ethernet_cable_length"
                  type="number"
                  value={formData.ethernet_cable_length || ""}
                  onChange={memoizedHandleInputChange}
                  placeholder="Enter ethernet cable length"
                  required
                  icon={<Box className="h-5 w-5 text-slate-gray/70" />}
                  {...inputFieldProps}
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
                  icon={<User className="h-5 w-5 text-slate-gray/70" />}
                  {...inputFieldProps}
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
                      .filter((item) => item.item_type === "Dish")
                      .map((item) => ({ value: item.id, label: `${item.name} - ${item.serial_number}` }))}
                    icon={<Package className="h-5 w-5 text-slate-gray/70" />}
                    {...inputFieldProps}
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
                    icon={<Hash className="h-5 w-5 text-slate-gray/70" />}
                    {...inputFieldProps}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {(formData.connection_type === "tv_cable" || formData.connection_type === "both") && (
        <div className="mb-6 bg-light-sky/20 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-deep-ocean mb-4">TV Cable Connection Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              icon={<Tv className="h-5 w-5 text-slate-gray/70" />}
              {...inputFieldProps}
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
                icon={<Hash className="h-5 w-5 text-slate-gray/70" />}
                {...inputFieldProps}
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
                  icon={<Hash className="h-5 w-5 text-slate-gray/70" />}
                  {...inputFieldProps}
                />
                <InputField
                  label="STB Serial Number"
                  name="stb_serial_number"
                  value={formData.stb_serial_number || ""}
                  onChange={memoizedHandleInputChange}
                  placeholder="Enter STB serial number"
                  required
                  icon={<Hash className="h-5 w-5 text-slate-gray/70" />}
                  {...inputFieldProps}
                />
              </>
            )}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-deep-ocean mb-6 border-b border-slate-gray/10 pb-2">
          Billing Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Package"
            name="service_plan_id"
            type="select"
            value={formData.service_plan_id || ""}
            onChange={memoizedHandleInputChange}
            required
            options={servicePlans.map((plan: ServicePlan) => ({ value: plan.id, label: plan.name }))}
            icon={<Package className="h-5 w-5 text-slate-gray/70" />}
            {...inputFieldProps}
          />
          <InputField
            label="Discount Amount"
            name="discount_amount"
            type="number"
            value={formData.discount_amount || ""}
            onChange={memoizedHandleInputChange}
            placeholder="Enter discount amount"
            icon={<DollarSign className="h-5 w-5 text-slate-gray/70" />}
            {...inputFieldProps}
          />
          <InputField
            label="Installation Date"
            name="installation_date"
            type="date"
            value={formData.installation_date || ""}
            onChange={memoizedHandleInputChange}
            required
            icon={<Calendar className="h-5 w-5 text-slate-gray/70" />}
            {...inputFieldProps}
          />
          <InputField
            label="Recharge Date"
            name="recharge_date"
            type="date"
            value={formData.recharge_date || ""}
            onChange={memoizedHandleInputChange}
            icon={<Calendar className="h-5 w-5 text-slate-gray/70" />}
            {...inputFieldProps}
          />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-deep-ocean mb-6 border-b border-slate-gray/10 pb-2">Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FileUploadField
            label="CNIC Front Image"
            name="cnic_front_image"
            onChange={memoizedHandleFileChange}
            currentImage={formData.cnic_front_image ? `/customers/cnic-front-image/${formData.id}` : undefined}
            disabled={false}
          />
          <FileUploadField
            label="CNIC Back Image"
            name="cnic_back_image"
            onChange={memoizedHandleFileChange}
            currentImage={formData.cnic_back_image ? `/customers/cnic-back-image/${formData.id}` : undefined}
            disabled={false}
          />
          <FileUploadField
            label="Agreement Document"
            name="agreement_document"
            onChange={memoizedHandleFileChange}
            currentImage={formData.agreement_document ? `/customers/agreement-document/${formData.id}` : undefined}
            disabled={false}
          />
        </div>
      </div>
    </form>
  )
}