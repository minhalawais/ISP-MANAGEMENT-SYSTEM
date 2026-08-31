"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch"
import L from "leaflet"
import { Crosshair, MapPin, Navigation } from "lucide-react"
import "leaflet/dist/leaflet.css"
import "leaflet-geosearch/dist/geosearch.css"

const DEFAULT_CENTER: [number, number] = [31.5204, 74.3587] // Lahore
const MARKER_ICON = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function parseGps(value?: string | null): [number, number] | null {
  if (!value) return null
  const parts = value.split(",").map((p) => Number(p.trim()))
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null
  const [lat, lng] = parts
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return [lat, lng]
}

function formatGps(lat: number, lng: number) {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapSearchControl() {
  const map = useMap()
  useEffect(() => {
    const provider = new OpenStreetMapProvider()
    const searchControl = new (GeoSearchControl as any)({
      provider,
      style: "bar",
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: false,
      searchLabel: "Search address",
    })
    map.addControl(searchControl)
    return () => {
      map.removeControl(searchControl)
    }
  }, [map])
  return null
}

function RecenterMap({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position, Math.max(map.getZoom(), 15))
    }
  }, [map, position])
  return null
}

export interface LocationPickerProps {
  address: string
  gpsCoordinates: string
  onAddressChange: (value: string) => void
  onGpsChange: (value: string) => void
  disabled?: boolean
}

export function LocationPicker({
  address,
  gpsCoordinates,
  onAddressChange,
  onGpsChange,
  disabled = false,
}: LocationPickerProps) {
  const [showMap, setShowMap] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  const position = useMemo(() => parseGps(gpsCoordinates), [gpsCoordinates])

  const applyCoords = useCallback(
    (lat: number, lng: number) => {
      onGpsChange(formatGps(lat, lng))
      setGeoError(null)
    },
    [onGpsChange]
  )

  const useCurrentLocation = () => {
    if (disabled) return
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported on this device")
      return
    }
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyCoords(pos.coords.latitude, pos.coords.longitude)
        setShowMap(true)
        setLocating(false)
      },
      (err) => {
        setGeoError(err.message || "Could not get current location")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Installation address</label>
        <textarea
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          rows={2}
          disabled={disabled}
          placeholder="House / street / landmark"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-2 focus:ring-portal-accent/40 disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">GPS coordinates</label>
        <input
          type="text"
          value={gpsCoordinates}
          onChange={(e) => onGpsChange(e.target.value)}
          disabled={disabled}
          placeholder="latitude,longitude"
          className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-portal-accent focus:outline-none focus:ring-2 focus:ring-portal-accent/40 disabled:bg-gray-50"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={disabled || locating}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Navigation className="h-3.5 w-3.5" />
          {locating ? "Locating…" : "Use current location"}
        </button>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          disabled={disabled}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Crosshair className="h-3.5 w-3.5" />
          {showMap ? "Hide map" : "Select on map"}
        </button>
      </div>

      {geoError && <p className="text-xs text-red-600">{geoError}</p>}

      {showMap && (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <p className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            Tap the map to set your location
          </p>
          <MapContainer
            center={position || DEFAULT_CENTER}
            zoom={position ? 16 : 12}
            style={{ height: 280, width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapSearchControl />
            <MapClickHandler onPick={applyCoords} />
            <RecenterMap position={position} />
            {position && <Marker position={position} icon={MARKER_ICON} />}
          </MapContainer>
        </div>
      )}
    </div>
  )
}
