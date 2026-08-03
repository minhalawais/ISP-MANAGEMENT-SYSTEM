export const createFormDataRequestConfig = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
})

export const getOperationErrorMessage = (error: any, title: string, operation = "save") => {
  const status = error?.response?.status
  const responseData = error?.response?.data

  if (status === 413) {
    return "Uploaded files exceed the maximum allowed size. Please select smaller files."
  }
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return "The request timed out. Please check your connection and try again."
  }
  if (!error?.response) {
    return "Network error. Please check your connection and try again."
  }
  if (typeof responseData === "string" && responseData.trim()) {
    return responseData
  }
  return responseData?.message || responseData?.error || `Failed to ${operation} ${title.toLowerCase()}`
}
