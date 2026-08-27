/**
 * Customer portal complaint form helpers — keep validation aligned with API.
 */

export const COMPLAINT_CATEGORIES = [
  { value: "no_internet", label: "No Internet / Connectivity" },
  { value: "slow_speed", label: "Slow Speed" },
  { value: "billing", label: "Billing / Invoice" },
  { value: "installation", label: "Installation / Relocation" },
  { value: "hardware", label: "Hardware / Equipment" },
  { value: "other", label: "Other" },
] as const

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number]["value"]

export function validatePortalComplaintCategory(category: string): string | null {
  if (!category || !COMPLAINT_CATEGORIES.some((c) => c.value === category)) {
    return "Please select a complaint category"
  }
  return null
}

export function validatePortalComplaintDescription(description: string): string | null {
  const cleaned = (description || "").trim()
  if (!cleaned) return "Description is required"
  if (cleaned.length < 10) return "Please describe the issue in at least 10 characters"
  if (cleaned.length > 2000) return "Description must be 2000 characters or fewer"
  return null
}

export function isAllowedComplaintAttachment(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  return ["pdf", "png", "jpg", "jpeg", "gif"].includes(ext)
}

const RESOLUTION_PROOF_IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp"] as const

export function isAllowedResolutionProofImage(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  return RESOLUTION_PROOF_IMAGE_EXTS.includes(ext as (typeof RESOLUTION_PROOF_IMAGE_EXTS)[number])
}

export function isComplaintImageFile(fileName: string | null | undefined): boolean {
  if (!fileName) return false
  const base = fileName.split(/[?#]/)[0]
  const ext = base.split(".").pop()?.toLowerCase() || ""
  return RESOLUTION_PROOF_IMAGE_EXTS.includes(ext as (typeof RESOLUTION_PROOF_IMAGE_EXTS)[number])
}

export function getComplaintCategoryLabel(category: string | null | undefined): string {
  return COMPLAINT_CATEGORIES.find((c) => c.value === category)?.label || category || "Other"
}
