import {
  isAllowedComplaintAttachment,
  isAllowedResolutionProofImage,
  isComplaintImageFile,
  validatePortalComplaintCategory,
  validatePortalComplaintDescription,
} from "./customerPortalComplaint.ts"

describe("customerPortalComplaint validation", () => {
  it("rejects empty and short descriptions", () => {
    expect(validatePortalComplaintDescription("")).toMatch(/required/i)
    expect(validatePortalComplaintDescription("short")).toMatch(/10/)
  })

  it("accepts valid description", () => {
    expect(validatePortalComplaintDescription("Internet is down since morning")).toBeNull()
  })

  it("requires a valid category", () => {
    expect(validatePortalComplaintCategory("")).toMatch(/category/i)
    expect(validatePortalComplaintCategory("unknown")).toMatch(/category/i)
    expect(validatePortalComplaintCategory("no_internet")).toBeNull()
  })

  it("validates attachment extensions", () => {
    expect(isAllowedComplaintAttachment("proof.jpg")).toBe(true)
    expect(isAllowedComplaintAttachment("notes.exe")).toBe(false)
  })

  it("accepts image files for resolution proof", () => {
    expect(isAllowedResolutionProofImage("site.webp")).toBe(true)
    expect(isAllowedResolutionProofImage("notes.pdf")).toBe(false)
  })

  it("detects image paths for live previews", () => {
    expect(isComplaintImageFile("uploads/proofs/shot.png")).toBe(true)
    expect(isComplaintImageFile("uploads/notes.pdf")).toBe(false)
    expect(isComplaintImageFile(null)).toBe(false)
  })
})
