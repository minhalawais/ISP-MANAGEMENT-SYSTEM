"use client"

import { useState, useEffect } from "react"
import { X, Download, Loader, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string | null
  title: string
  isLoading?: boolean
}

export function ImageViewerModal({ isOpen, onClose, imageUrl, title, isLoading = false }: ImageViewerModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  // Reset zoom and rotation when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement("a")
      link.href = imageUrl
      link.download = `${title.replace(/\s+/g, "_")}_${Date.now()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Container */}
      <div
        className="relative z-10 w-full max-w-5xl max-h-[90vh] mx-4 flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-2xl px-6 py-4 flex items-center justify-between shadow-lg">
          <h3 className="text-lg font-semibold text-white truncate pr-4">{title}</h3>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Zoom Out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <span className="text-slate-400 text-sm min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Zoom In"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <div className="w-px h-6 bg-slate-600 mx-2" />
            {/* Rotate */}
            <button
              onClick={handleRotate}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Rotate"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <div className="w-px h-6 bg-slate-600 mx-2" />
            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={!imageUrl || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <div className="w-px h-6 bg-slate-600 mx-2" />
            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-200"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-900/95 rounded-b-2xl overflow-auto p-6 min-h-[400px] max-h-[calc(90vh-80px)] flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-800 rounded-full">
                <Loader className="h-10 w-10 text-blue-400 animate-spin" />
              </div>
              <p className="text-slate-400 text-sm">Loading...</p>
            </div>
          ) : imageUrl ? (
            <div className="relative overflow-auto max-w-full max-h-full">
              <img
                src={imageUrl}
                alt={title}
                className="max-w-none transition-transform duration-300 ease-out rounded-lg shadow-2xl"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-800 rounded-full">
                <X className="h-10 w-10 text-red-400" />
              </div>
              <p className="text-slate-400 text-sm">Failed to load image</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook to manage image viewer state
export function useImageViewer() {
  const [isOpen, setIsOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const openViewer = async (fetchUrl: string, documentTitle: string, axiosInstance: any) => {
    setTitle(documentTitle)
    setIsOpen(true)
    setIsLoading(true)
    setImageUrl(null)

    try {
      const response = await axiosInstance.get(fetchUrl, { responseType: "blob" })
      const url = URL.createObjectURL(response.data)
      setImageUrl(url)
    } catch (error) {
      console.error("Error loading image:", error)
      setImageUrl(null)
    } finally {
      setIsLoading(false)
    }
  }

  const closeViewer = () => {
    setIsOpen(false)
    // Revoke URL after closing
    if (imageUrl) {
      setTimeout(() => URL.revokeObjectURL(imageUrl), 100)
    }
  }

  return {
    isOpen,
    imageUrl,
    title,
    isLoading,
    openViewer,
    closeViewer,
  }
}
