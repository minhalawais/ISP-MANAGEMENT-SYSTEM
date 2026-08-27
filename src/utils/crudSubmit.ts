import { formatApiError } from "./notify.ts"

export const createFormDataRequestConfig = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
})

export const getOperationErrorMessage = (error: any, title: string, operation = "save") => {
  return formatApiError(error, `Failed to ${operation} ${String(title || "item").toLowerCase()}`)
}
