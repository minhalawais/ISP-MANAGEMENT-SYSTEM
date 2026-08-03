import {
  formatCnicInput,
  formatPakistaniMobile,
  getCnicValidationMessage,
  getPakistaniMobileValidationMessage,
  isValidCnic,
  isValidPakistaniMobile,
} from "./contactValidation.ts"

describe("contact validation helpers", () => {
  it("formats CNIC input as 13 digits only", () => {
    expect(formatCnicInput("12345-1234567-1")).toBe("1234512345671")
    expect(formatCnicInput("1234512345671999")).toBe("1234512345671")
  })

  it("validates CNIC length", () => {
    expect(isValidCnic("1234512345671")).toBe(true)
    expect(getCnicValidationMessage("12345")).toBe("CNIC must be exactly 13 digits")
  })

  it("formats Pakistani mobile numbers from common pasted formats", () => {
    expect(formatPakistaniMobile("03001234567")).toBe("+92 (300)-1234567")
    expect(formatPakistaniMobile("3001234567")).toBe("+92 (300)-1234567")
    expect(formatPakistaniMobile("+923001234567")).toBe("+92 (300)-1234567")
    expect(formatPakistaniMobile("00923001234567")).toBe("+92 (300)-1234567")
  })

  it("validates Pakistani mobile numbers", () => {
    expect(isValidPakistaniMobile("+92 (300)-1234567")).toBe(true)
    expect(getPakistaniMobileValidationMessage("0211234567", "Contact number")).toBe(
      "Contact number must be a valid Pakistani mobile number",
    )
  })
})
