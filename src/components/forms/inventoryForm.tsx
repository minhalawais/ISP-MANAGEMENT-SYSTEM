"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Barcode, Truck, Package, DollarSign, Hash, Wifi, Monitor, Cpu, Radio, Plug, Paperclip } from "lucide-react"

interface InventoryFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  isEditing: boolean
  suppliers: { id: string; name: string }[]
}

export function InventoryForm({ formData, handleInputChange, isEditing, suppliers }: InventoryFormProps) {
  const [selectedItemType, setSelectedItemType] = useState(formData.item_type || "")
  const [attributes, setAttributes] = useState(formData.attributes || {})

  useEffect(() => {
    setSelectedItemType(formData.item_type || "")
    // Ensure attributes is properly initialized
    if (formData.attributes) {
      setAttributes(formData.attributes)
    } else {
      setAttributes({})
    }
  }, [formData])

  const handleAttributeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const updatedAttributes = { ...attributes, [name]: value }
    setAttributes(updatedAttributes)

    // Update the formData with the new attributes
    // Create a custom event to update the parent's formData
    const customEvent = {
      target: {
        name: "attributes",
        value: updatedAttributes,
      },
    } as React.ChangeEvent<HTMLInputElement>

    handleInputChange(customEvent)
  }

  const itemTypes = [
    "Fiber Cable",
    "EtherNet Cable",
    "Splitters",
    "ONT",
    "ONU",
    "Fibe OPTIC Patch Cord",
    "Switches",
    "Router",
    "Ethernet Patch Cord",
    "Node",
    "STB",
    "Dish",
    "Adopter",
    "Cable Ties",
    "Others",
  ]

  const renderTypeSpecificFields = () => {
    switch (selectedItemType) {
      case "EtherNet Cable":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Cable Type</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Paperclip className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="type"
                value={attributes.type || ""}
                onChange={handleAttributeChange}
                placeholder="Enter cable type"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                         text-gray-900 placeholder-gray-400 
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                         transition-all duration-200"
              />
            </div>
          </div>
        )

      case "ONT":
      case "ONU":
      case "Router":
      case "STB":
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Serial Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Barcode className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="serial_number"
                  value={attributes.serial_number || ""}
                  onChange={handleAttributeChange}
                  placeholder="Enter serial number"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                           text-gray-900 placeholder-gray-400 
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                           transition-all duration-200"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Cpu className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="type"
                  value={attributes.type || ""}
                  onChange={handleAttributeChange}
                  placeholder="Enter device type"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                           text-gray-900 placeholder-gray-400 
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                           transition-all duration-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Model</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Monitor className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="model"
                  value={attributes.model || ""}
                  onChange={handleAttributeChange}
                  placeholder="Enter model"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                           text-gray-900 placeholder-gray-400 
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                           transition-all duration-200"
                />
              </div>
            </div>
          </>
        )

      case "Fibe OPTIC Patch Cord":
      case "Ethernet Patch Cord":
      case "Node":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Wifi className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="type"
                value={attributes.type || ""}
                onChange={handleAttributeChange}
                placeholder="Enter type"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                         text-gray-900 placeholder-gray-400 
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                         transition-all duration-200"
              />
            </div>
          </div>
        )

      case "Switches":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Switch Type</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Wifi className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="switch_type"
                value={attributes.switch_type || ""}
                onChange={(e) => handleAttributeChange({ target: { name: "type", value: e.target.value } })}
                placeholder="Enter switch type"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                         text-gray-900 placeholder-gray-400 
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                         transition-all duration-200"
              />
            </div>
          </div>
        )

      case "Dish":
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">MAC Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Barcode className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="mac_address"
                  value={attributes.mac_address || ""}
                  onChange={handleAttributeChange}
                  placeholder="Enter MAC address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                           text-gray-900 placeholder-gray-400 
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                           transition-all duration-200"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Radio className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="type"
                  value={attributes.type || ""}
                  onChange={handleAttributeChange}
                  placeholder="Enter dish type"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                           text-gray-900 placeholder-gray-400 
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                           transition-all duration-200"
                />
              </div>
            </div>
          </>
        )

      case "Adopter":
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Volt</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Plug className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="volt"
                  value={attributes.volt || ""}
                  onChange={handleAttributeChange}
                  placeholder="Enter volt"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                           text-gray-900 placeholder-gray-400 
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                           transition-all duration-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Amp</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Plug className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="amp"
                  value={attributes.amp || ""}
                  onChange={handleAttributeChange}
                  placeholder="Enter amp"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                           text-gray-900 placeholder-gray-400 
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                           transition-all duration-200"
                />
              </div>
            </div>
          </>
        )

      case "Cable Ties":
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Paperclip className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="type"
                  value={attributes.type || ""}
                  onChange={handleAttributeChange}
                  placeholder="Enter tie type"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                           text-gray-900 placeholder-gray-400 
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                           transition-all duration-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Model</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="model"
                  value={attributes.model || ""}
                  onChange={handleAttributeChange}
                  placeholder="Enter model"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                           text-gray-900 placeholder-gray-400 
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                           transition-all duration-200"
                />
              </div>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Item Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Item Type</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <select
            name="item_type"
            value={formData.item_type || ""}
            onChange={(e) => {
              handleInputChange(e)
              setSelectedItemType(e.target.value)
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 appearance-none
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
            required
          >
            <option value="">Select Item Type</option>
            {itemTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Type-specific fields */}
      {selectedItemType && renderTypeSpecificFields()}

      {/* Vendor */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Vendor</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Truck className="h-5 w-5 text-gray-400" />
          </div>
          <select
            name="vendor"
            value={formData.vendor || ""}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 appearance-none
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
            required
          >
            <option value="">Select Vendor</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Quantity and Unit Price Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quantity */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="quantity"
              value={formData.quantity || ""}
              onChange={handleInputChange}
              placeholder="Enter quantity"
              min="1"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                       text-gray-900 placeholder-gray-400 
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                       transition-all duration-200"
              required
            />
          </div>
        </div>

        {/* Unit Price */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Unit Price</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="unit_price"
              value={formData.unit_price || ""}
              onChange={handleInputChange}
              placeholder="Enter unit price"
              step="0.01"
              min="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                       text-gray-900 placeholder-gray-400 
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                       transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
