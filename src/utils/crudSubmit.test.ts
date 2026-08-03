import { createFormDataRequestConfig, getOperationErrorMessage } from "./crudSubmit.ts"

describe("CRUD submit helpers", () => {
  it("does not set Content-Type for FormData requests", () => {
    expect(createFormDataRequestConfig("token")).toEqual({
      headers: { Authorization: "Bearer token" },
    })
  })

  it("uses the backend message for duplicate conflicts", () => {
    expect(getOperationErrorMessage({
      response: {
        status: 409,
        data: { error: "duplicate_employee", message: "Username already exists" },
      },
    }, "Employee")).toBe("Username already exists")
  })

  it("handles upload-size, timeout, and network failures", () => {
    expect(getOperationErrorMessage({ response: { status: 413, data: {} } }, "Employee"))
      .toContain("maximum allowed size")
    expect(getOperationErrorMessage({ code: "ECONNABORTED" }, "Employee"))
      .toContain("timed out")
    expect(getOperationErrorMessage({ request: {} }, "Employee"))
      .toContain("Network error")
  })

  it("uses operation-specific fallback wording", () => {
    expect(getOperationErrorMessage({ response: { status: 500, data: {} } }, "Invoice", "delete"))
      .toBe("Failed to delete invoice")
  })
})
