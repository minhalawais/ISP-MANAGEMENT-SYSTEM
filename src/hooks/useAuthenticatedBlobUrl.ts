import { useEffect, useState } from "react"
import axiosInstance from "../utils/axiosConfig.ts"

export function useAuthenticatedBlobUrl(url: string | null) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!url) {
      setObjectUrl(null)
      setLoading(false)
      setError(false)
      return
    }

    let cancelled = false
    let created: string | null = null
    setLoading(true)
    setError(false)
    setObjectUrl(null)

    axiosInstance
      .get(url, { responseType: "blob", skipErrorToast: true } as any)
      .then((response) => {
        created = window.URL.createObjectURL(response.data)
        if (cancelled) {
          window.URL.revokeObjectURL(created)
          return
        }
        setObjectUrl(created)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (created) window.URL.revokeObjectURL(created)
    }
  }, [url])

  return { objectUrl, loading, error }
}
