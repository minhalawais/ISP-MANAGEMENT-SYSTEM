export const COMPLAINT_WRITABLE_FIELDS = [
  "customer_id",
  "assigned_to",
  "description",
  "category",
  "status",
  "remarks",
  "response_due_date",
  "is_active",
] as const

export function getComplaintAttachmentFile(formData: Record<string, unknown>): File | null {
  return formData.attachment instanceof File ? formData.attachment : null
}

export function buildComplaintJsonPayload(formData: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const key of COMPLAINT_WRITABLE_FIELDS) {
    const value = formData[key]
    if (value === undefined || value === null || value === "") continue
    if (typeof value === "object") continue
    payload[key] = value
  }
  return payload
}

export function buildComplaintFormData(formData: Record<string, unknown>): FormData {
  const body = new FormData()
  const payload = buildComplaintJsonPayload(formData)
  Object.entries(payload).forEach(([key, value]) => {
    body.append(key, String(value))
  })
  const file = getComplaintAttachmentFile(formData)
  if (file) {
    body.append("attachment", file, file.name)
  }
  return body
}
