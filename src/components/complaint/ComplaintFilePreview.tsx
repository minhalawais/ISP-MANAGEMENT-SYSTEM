"use client"

import { useState } from "react"
import { Paperclip } from "lucide-react"
import { toast } from "../../utils/notify.ts";
import axiosInstance from "../../utils/axiosConfig.ts"
import { useAuthenticatedBlobUrl } from "../../hooks/useAuthenticatedBlobUrl.ts"
import { isComplaintImageFile } from "../../utils/customerPortalComplaint.ts"

function fileNameFromPath(path: string) {
  return path.split(/[\\/]/).pop() || "file"
}

async function openBlobFromUrl(fetchUrl: string, downloadName: string) {
  const response = await axiosInstance.get(fetchUrl, { responseType: "blob" })
  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement("a")
  link.href = url
  link.download = downloadName
  link.target = "_blank"
  link.rel = "noopener noreferrer"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
}

export function ComplaintFilePreview({
  label,
  filePath,
  fetchUrl,
  actionClassName = "text-sky-700",
}: {
  label: string
  filePath: string
  fetchUrl: string
  actionClassName?: string
}) {
  const isImage = isComplaintImageFile(filePath)
  const { objectUrl, loading, error } = useAuthenticatedBlobUrl(isImage ? fetchUrl : null)
  const [downloading, setDownloading] = useState(false)
  const downloadName = fileNameFromPath(filePath)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      if (objectUrl) {
        const link = document.createElement("a")
        link.href = objectUrl
        link.download = downloadName
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      await openBlobFromUrl(fetchUrl, downloadName)
    } catch {
      toast.error("Failed to download file")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-800">
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="truncate">{label}</span>
        </span>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className={`shrink-0 text-xs font-medium hover:underline disabled:opacity-50 ${actionClassName}`}
        >
          {downloading ? "Downloading..." : "Download"}
        </button>
      </div>
      {isImage && (
        <div className="flex min-h-[10rem] items-center justify-center bg-slate-50 px-3 pb-3">
          {loading && (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          )}
          {!loading && error && <p className="text-xs text-slate-500">Preview unavailable</p>}
          {!loading && objectUrl && (
            <img
              src={objectUrl}
              alt={label}
              className="max-h-52 w-full cursor-pointer rounded object-contain"
              onClick={handleDownload}
            />
          )}
        </div>
      )}
    </div>
  )
}
