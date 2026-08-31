"use client"

import { useState, useEffect } from "react"
import { X, Download, Loader, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import {
  MODAL_HEADER,
  MODAL_OVERLAY,
  MODAL_SHELL,
} from "../ui/modalStyles.ts"

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string | null
  title: string
  isLoading?: boolean
}

const toolbarBtn =
  "p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-40"

/** Primary action on brand header — light so it stays visible on #2A5C8A. */
const headerActionBtn =
  "h-9 px-3 text-sm font-medium inline-flex items-center gap-1.5 rounded-md bg-white text-[#2A5C8A] shadow-sm hover:bg-slate-100 disabled:opacity-50 transition-colors"

export function ImageViewerModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  isLoading = false,
}: ImageViewerModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
    }
  }, [isOpen])

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
    if (!imageUrl) return
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `${title.replace(/\s+/g, "_")}_${Date.now()}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  return (
    <div className="fixed z-[9999] inset-0 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className={MODAL_OVERLAY} aria-hidden="true" onClick={onClose} />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom text-left transform transition-all sm:my-8 sm:align-middle sm:w-full sm:max-w-5xl animate-in fade-in zoom-in-95 duration-300 ${MODAL_SHELL}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b ${MODAL_HEADER}`}>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white truncate min-w-0">
              {title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={handleZoomOut} className={toolbarBtn} title="Zoom out" aria-label="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-white/70 text-xs tabular-nums min-w-[2.5rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button type="button" onClick={handleZoomIn} className={toolbarBtn} title="Zoom in" aria-label="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-white/20 mx-1" />
              <button type="button" onClick={handleRotate} className={toolbarBtn} title="Rotate" aria-label="Rotate">
                <RotateCw className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-white/20 mx-1" />
              <button
                type="button"
                onClick={handleDownload}
                disabled={!imageUrl || isLoading}
                className={headerActionBtn}
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
              <div className="w-px h-4 bg-white/20 mx-1" />
              <button
                type="button"
                onClick={onClose}
                className={toolbarBtn}
                title="Close"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            className="px-5 sm:px-6 py-5 bg-slate-100 min-h-[360px] max-h-[calc(90vh-88px)] flex items-center justify-center"
            style={{ overflow: zoom > 1 ? "auto" : "hidden" }}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader className="h-8 w-8 text-[#2A5C8A] animate-spin" />
                <p className="text-sm text-slate-500">Loading…</p>
              </div>
            ) : imageUrl ? (
              <div
                className="relative flex items-center justify-center w-full h-full"
                style={{ overflow: zoom > 1 ? "auto" : "visible" }}
              >
                <img
                  src={imageUrl}
                  alt={title}
                  className="transition-transform duration-200 ease-out rounded-md border border-slate-200 shadow-sm bg-white"
                  style={{
                    maxWidth: zoom === 1 ? "100%" : "none",
                    maxHeight: zoom === 1 ? "calc(90vh - 160px)" : "none",
                    objectFit: "contain",
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-slate-500">Failed to load image</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

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
      const response = await axiosInstance.get(fetchUrl, {
        responseType: "blob",
        skipErrorToast: true,
      })
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
