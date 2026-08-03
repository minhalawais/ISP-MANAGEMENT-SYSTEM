export const CNIC_LENGTH = 13

export const formatCnicInput = (value: string) => value.replace(/\D/g, "").slice(0, CNIC_LENGTH)

export const isValidCnic = (value: string) => formatCnicInput(value).length === CNIC_LENGTH

export const getCnicValidationMessage = (value: string, label = "CNIC") => {
  if (!value) return `${label} is required`
  return isValidCnic(value) ? null : `${label} must be exactly 13 digits`
}

export const getPakistaniMobileDigits = (value: string) => {
  let digits = value.replace(/\D/g, "")

  if (digits.startsWith("0092")) {
    digits = digits.slice(4)
  } else if (digits.startsWith("92")) {
    digits = digits.slice(2)
  } else if (digits.startsWith("0") && digits.length > 1) {
    digits = digits.slice(1)
  }

  return digits.slice(0, 10)
}

export const formatPakistaniMobile = (value: string) => {
  const digits = getPakistaniMobileDigits(value)
  if (!digits) return ""

  if (digits.length <= 3) {
    return `+92 (${digits}`
  }

  return `+92 (${digits.slice(0, 3)})-${digits.slice(3)}`
}

export const isValidPakistaniMobile = (value: string) => /^3\d{9}$/.test(getPakistaniMobileDigits(value))

export const getPakistaniMobileValidationMessage = (value: string, label = "Mobile number") => {
  if (!value) return `${label} is required`
  return isValidPakistaniMobile(value) ? null : `${label} must be a valid Pakistani mobile number`
}
