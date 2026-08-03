import { MAX_EMPLOYEE_UPLOAD_BYTES, validateEmployeeFiles } from "./employeeValidation.ts"

describe("employee upload validation", () => {
  it("accepts supported files within the combined limit", () => {
    const files = {
      picture: new File([new Uint8Array(10)], "picture.png", { type: "image/png" }),
      cnic_image: new File([new Uint8Array(10)], "cnic.pdf", { type: "application/pdf" }),
    }

    expect(validateEmployeeFiles(files)).toBeNull()
  })

  it("rejects unsupported extensions", () => {
    const file = new File([new Uint8Array(10)], "malware.exe", { type: "application/octet-stream" })
    expect(validateEmployeeFiles({ picture: file })).toContain("is not supported")
  })

  it("rejects files over the combined limit", () => {
    const file = new File([new Uint8Array(MAX_EMPLOYEE_UPLOAD_BYTES + 1)], "large.pdf", { type: "application/pdf" })
    expect(validateEmployeeFiles({ cnic_image: file })).toContain("15 MB")
  })
})
