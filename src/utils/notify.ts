import {
  toast as rawToast,
  type ToastOptions,
  type TypeOptions,
  type ToastContent,
  type Id,
} from "react-toastify"

const DEFAULT_OPTIONS: ToastOptions = {
  hideProgressBar: false,
}

/** Flatten API / unknown values into a readable toast string. */
export function formatToastMessage(value: unknown, fallback = "Something went wrong"): string {
  if (value == null || value === "") return fallback

  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed || fallback
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => formatToastMessage(item, ""))
      .filter(Boolean)
    return parts.length ? parts.join(". ") : fallback
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>

    for (const key of ["message", "error", "detail", "title", "msg"]) {
      if (record[key] != null && record[key] !== "") {
        return formatToastMessage(record[key], fallback)
      }
    }

    if (record.errors && typeof record.errors === "object") {
      const errors = record.errors as Record<string, unknown> | unknown[]
      if (Array.isArray(errors)) {
        return formatToastMessage(errors, fallback)
      }
      const fieldMessages = Object.entries(errors).flatMap(([field, messages]) => {
        const text = formatToastMessage(messages, "")
        if (!text) return []
        const label = field.replace(/_/g, " ")
        return [`${label}: ${text}`]
      })
      if (fieldMessages.length) return fieldMessages.join(". ")
    }

    try {
      const json = JSON.stringify(record)
      if (json && json !== "{}") return json
    } catch {
      /* ignore */
    }
  }

  return fallback
}

/** Extract a user-facing message from an Axios-like error. */
export function formatApiError(error: unknown, fallback = "Request failed. Please try again."): string {
  const err = error as {
    code?: string
    message?: string
    response?: { status?: number; data?: unknown }
  }

  if (err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT") {
    return "The request timed out. Please check your connection and try again."
  }

  if (!err?.response) {
    if (err?.code === "ERR_NETWORK" || (typeof err?.message === "string" && /network/i.test(err.message))) {
      return "Network error. Please check your connection and try again."
    }
    // Axios network failures often have `request` but no `response`
    if ((error as { request?: unknown })?.request) {
      return "Network error. Please check your connection and try again."
    }
    return formatToastMessage(err?.message, fallback)
  }

  const status = err.response.status
  if (status === 413) {
    return "Uploaded files exceed the maximum allowed size. Please select smaller files."
  }
  if (status === 401) {
    return formatToastMessage(err.response.data, fallback || "Session expired. Please sign in again.")
  }
  if (status === 403) {
    return formatToastMessage(err.response.data, fallback || "You don't have permission to perform this action.")
  }
  if (status === 404) {
    return formatToastMessage(err.response.data, fallback || "The requested resource was not found.")
  }
  if (status === 429) {
    return formatToastMessage(err.response.data, fallback || "Too many requests. Please try again later.")
  }
  if (status && status >= 500) {
    return formatToastMessage(err.response.data, fallback || "Server error. Please try again later.")
  }

  return formatToastMessage(err.response.data, fallback)
}

function contentToString(content: ToastContent): string {
  if (typeof content === "function") {
    // Custom render functions — leave as-is via raw toast path
    return ""
  }
  return formatToastMessage(content)
}

function showTyped(
  type: Extract<TypeOptions, "success" | "error" | "info" | "warning">,
  content: ToastContent,
  options?: ToastOptions,
): Id {
  const opts: ToastOptions = { ...DEFAULT_OPTIONS, ...options }
  // Drop legacy pastel overrides so global CSS owns the look
  if (opts.style) {
    const style = { ...(opts.style as Record<string, unknown>) }
    delete style.background
    delete style.color
    opts.style = Object.keys(style).length ? (style as ToastOptions["style"]) : undefined
  }

  if (typeof content === "function") {
    return rawToast[type](content, opts)
  }

  const text = contentToString(content)
  return rawToast[type](text, opts)
}

/** Drop-in toast that formats messages and ignores vibe-coded pastel styles. */
export const toast = Object.assign(
  (content: ToastContent, options?: ToastOptions) => {
    if (typeof content === "function") return rawToast(content, { ...DEFAULT_OPTIONS, ...options })
    return rawToast(formatToastMessage(content), { ...DEFAULT_OPTIONS, ...options })
  },
  {
    success: (content: ToastContent, options?: ToastOptions) => showTyped("success", content, options),
    error: (content: ToastContent, options?: ToastOptions) => showTyped("error", content, options),
    info: (content: ToastContent, options?: ToastOptions) => showTyped("info", content, options),
    warning: (content: ToastContent, options?: ToastOptions) => showTyped("warning", content, options),
    warn: (content: ToastContent, options?: ToastOptions) => showTyped("warning", content, options),
    dismiss: rawToast.dismiss,
    isActive: rawToast.isActive,
    update: rawToast.update,
    done: rawToast.done,
    onChange: rawToast.onChange,
    clearWaitingQueue: rawToast.clearWaitingQueue,
  },
)

export const notify = {
  success: (message: unknown, options?: ToastOptions) => showTyped("success", formatToastMessage(message), options),
  error: (message: unknown, options?: ToastOptions) => showTyped("error", formatToastMessage(message), options),
  warning: (message: unknown, options?: ToastOptions) => showTyped("warning", formatToastMessage(message), options),
  info: (message: unknown, options?: ToastOptions) => showTyped("info", formatToastMessage(message), options),
  apiError: (error: unknown, fallback?: string, options?: ToastOptions) =>
    showTyped("error", formatApiError(error, fallback), options),
}
