"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import { Save } from "lucide-react"

interface APIConnection {
  id: string
  name: string
  provider_type: string
  description: string
  connection_config: any
  metrics_config: any
}

interface APIConnectionFormProps {
  connection?: APIConnection | null
  onSuccess: () => void
}

export default function APIConnectionForm({ connection, onSuccess }: APIConnectionFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    provider_type: "custom",
    description: "",
    connection_config: {
      base_url: "",
      auth_type: "basic",
      credentials: {
        username: "",
        password: "",
        client_id: "",
        client_secret: "",
        token_url: "",
        bearer_token: "",
        custom_header_name: "",
        custom_header_value: "",
      },
      timeout: 30,
      verify_ssl: true,
    },
    metrics_config: {
      enabled: true,
      polling_interval: 300,
      customer_mapping_field: "internet_id",
      enabled_metrics: [],
      endpoints: {},
    },
  })

  const [isLoading, setIsLoading] = useState(false)
  const [customMetrics, setCustomMetrics] = useState<any[]>([])
  const [authType, setAuthType] = useState("basic")

  useEffect(() => {
    if (connection) {
      setFormData({
        name: connection.name,
        provider_type: connection.provider_type,
        description: connection.description,
        connection_config: connection.connection_config,
        metrics_config: connection.metrics_config,
      })
      setAuthType(connection.connection_config.auth_type)
    }
  }, [connection])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleConnectionConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      connection_config: {
        ...prev.connection_config,
        [name]: value,
      },
    }))
  }

  const handleAuthTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target
    setAuthType(value)
    setFormData((prev) => ({
      ...prev,
      connection_config: {
        ...prev.connection_config,
        auth_type: value,
      },
    }))
  }

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      connection_config: {
        ...prev.connection_config,
        credentials: {
          ...prev.connection_config.credentials,
          [name]: value,
        },
      },
    }))
  }

  const handleMetricToggle = (metric: string) => {
    setFormData((prev) => ({
      ...prev,
      metrics_config: {
        ...prev.metrics_config,
        enabled_metrics: prev.metrics_config.enabled_metrics.includes(metric)
          ? prev.metrics_config.enabled_metrics.filter((m: string) => m !== metric)
          : [...prev.metrics_config.enabled_metrics, metric],
      },
    }))
  }

  const handleAddCustomMetric = () => {
    setCustomMetrics([
      ...customMetrics,
      {
        name: "",
        url: "",
        method: "GET",
        field_mapping: {},
      },
    ])
  }

  const handleRemoveCustomMetric = (index: number) => {
    setCustomMetrics(customMetrics.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = getToken()
      const endpoint = connection ? `/api-connections/update/${connection.id}` : "/api-connections/add"
      const method = connection ? "put" : "post"

      await axiosInstance[method](endpoint, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success(connection ? "API connection updated successfully" : "API connection added successfully", {
        style: { background: "#D1FAE5", color: "#10B981" },
      })
      onSuccess()
    } catch (error) {
      console.error("Failed to save API connection", error)
      toast.error("Failed to save API connection", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const availableMetrics = [
    { id: "bandwidth", label: "Bandwidth Usage", description: "Monitor customer bandwidth" },
    { id: "customer_status", label: "Customer Status", description: "Track customer online/offline" },
    { id: "device_health", label: "Device Health", description: "Monitor CPU, memory, uptime" },
    { id: "interface_status", label: "Interface Status", description: "Track interface statistics" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold" style={{ color: "#2C3E50" }}>
          Basic Information
        </h3>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
            Connection Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Main Mikrotik Router"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
              Provider Type *
            </label>
            <select
              name="provider_type"
              value={formData.provider_type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
              required
            >
              <option value="mikrotik">Mikrotik</option>
              <option value="ubiquiti">Ubiquiti</option>
              <option value="cisco">Cisco</option>
              <option value="custom">Custom REST API</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
              Polling Interval (seconds)
            </label>
            <input
              type="number"
              value={formData.metrics_config.polling_interval}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metrics_config: {
                    ...prev.metrics_config,
                    polling_interval: Number.parseInt(e.target.value),
                  },
                }))
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
              min="60"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Optional description"
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
          />
        </div>
      </div>

      {/* Connection Configuration */}
      <div className="space-y-4 border-t pt-6" style={{ borderColor: "#B3C8CF" }}>
        <h3 className="text-lg font-semibold" style={{ color: "#2C3E50" }}>
          Connection Configuration
        </h3>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
            Base URL *
          </label>
          <input
            type="url"
            name="base_url"
            value={formData.connection_config.base_url}
            onChange={handleConnectionConfigChange}
            placeholder="https://192.168.1.1"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
              Authentication Type
            </label>
            <select
              name="auth_type"
              value={authType}
              onChange={handleAuthTypeChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
            >
              <option value="basic">Basic Auth (Username & Password)</option>
              <option value="bearer">Bearer Token</option>
              <option value="oauth">OAuth 2.0</option>
              <option value="custom">Custom Header</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
              Timeout (seconds)
            </label>
            <input
              type="number"
              name="timeout"
              value={formData.connection_config.timeout}
              onChange={handleConnectionConfigChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
              min="5"
            />
          </div>
        </div>

        {authType === "basic" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg" style={{ backgroundColor: "#F1F0E8" }}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.connection_config.credentials.username}
                onChange={handleCredentialsChange}
                placeholder="Enter username"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.connection_config.credentials.password}
                onChange={handleCredentialsChange}
                placeholder="Enter password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
                required
              />
            </div>
          </div>
        )}

        {authType === "bearer" && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: "#F1F0E8" }}>
            <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
              Bearer Token *
            </label>
            <input
              type="password"
              name="bearer_token"
              value={formData.connection_config.credentials.bearer_token}
              onChange={handleCredentialsChange}
              placeholder="Enter your bearer token"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
              required
            />
            <p className="text-xs mt-2" style={{ color: "#7F8C8D" }}>
              Token will be sent as: Authorization: Bearer {"<token>"}
            </p>
          </div>
        )}

        {authType === "oauth" && (
          <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: "#F1F0E8" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
                  Client ID *
                </label>
                <input
                  type="text"
                  name="client_id"
                  value={formData.connection_config.credentials.client_id}
                  onChange={handleCredentialsChange}
                  placeholder="Enter client ID"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
                  Client Secret *
                </label>
                <input
                  type="password"
                  name="client_secret"
                  value={formData.connection_config.credentials.client_secret}
                  onChange={handleCredentialsChange}
                  placeholder="Enter client secret"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
                Token URL *
              </label>
              <input
                type="url"
                name="token_url"
                value={formData.connection_config.credentials.token_url}
                onChange={handleCredentialsChange}
                placeholder="https://api.example.com/oauth/token"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
                required
              />
            </div>

            <p className="text-xs" style={{ color: "#7F8C8D" }}>
              OAuth 2.0 credentials will be used to obtain access tokens automatically
            </p>
          </div>
        )}

        {authType === "custom" && (
          <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: "#F1F0E8" }}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
                Header Name *
              </label>
              <input
                type="text"
                name="custom_header_name"
                value={formData.connection_config.credentials.custom_header_name}
                onChange={handleCredentialsChange}
                placeholder="e.g., X-API-Key"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
                Header Value *
              </label>
              <input
                type="password"
                name="custom_header_value"
                value={formData.connection_config.credentials.custom_header_value}
                onChange={handleCredentialsChange}
                placeholder="Enter header value"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
                required
              />
            </div>

            <p className="text-xs" style={{ color: "#7F8C8D" }}>
              Custom header will be sent with every request
            </p>
          </div>
        )}
      </div>

      {/* Metrics Configuration */}
      <div className="space-y-4 border-t pt-6" style={{ borderColor: "#B3C8CF" }}>
        <h3 className="text-lg font-semibold" style={{ color: "#2C3E50" }}>
          Metrics Configuration
        </h3>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
            Customer Mapping Field
          </label>
          <select
            value={formData.metrics_config.customer_mapping_field}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                metrics_config: {
                  ...prev.metrics_config,
                  customer_mapping_field: e.target.value,
                },
              }))
            }
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
          >
            <option value="internet_id">Internet ID</option>
            <option value="mac_address">MAC Address</option>
            <option value="ip_address">IP Address</option>
            <option value="pppoe_username">PPPoE Username</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: "#2C3E50" }}>
            Enable Metrics
          </label>
          <div className="space-y-2">
            {availableMetrics.map((metric) => (
              <label
                key={metric.id}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                style={{ borderColor: "#B3C8CF" }}
              >
                <input
                  type="checkbox"
                  checked={formData.metrics_config.enabled_metrics.includes(metric.id)}
                  onChange={() => handleMetricToggle(metric.id)}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <p className="font-medium" style={{ color: "#2C3E50" }}>
                    {metric.label}
                  </p>
                  <p className="text-sm" style={{ color: "#7F8C8D" }}>
                    {metric.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-6 border-t" style={{ borderColor: "#B3C8CF" }}>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2 text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
          style={{ backgroundColor: "#89A8B2" }}
        >
          <Save className="h-5 w-5" />
          {isLoading ? "Saving..." : connection ? "Update Connection" : "Create Connection"}
        </button>
      </div>
    </form>
  )
}
