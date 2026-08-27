import { formatApiError, formatToastMessage } from "./notify.ts"

describe("formatToastMessage", () => {
  it("returns trimmed strings", () => {
    expect(formatToastMessage("  Saved  ")).toBe("Saved")
  })

  it("flattens field error objects", () => {
    expect(
      formatToastMessage({
        errors: {
          username: ["already taken"],
          email: "invalid",
        },
      }),
    ).toBe("username: already taken. email: invalid")
  })

  it("prefers message over nested error codes", () => {
    expect(
      formatToastMessage({
        error: "duplicate_employee",
        message: "Username already exists",
      }),
    ).toBe("Username already exists")
  })

  it("joins array payloads", () => {
    expect(formatToastMessage(["First issue", "Second issue"])).toBe("First issue. Second issue")
  })
})

describe("formatApiError", () => {
  it("uses backend message when present", () => {
    expect(
      formatApiError(
        { response: { status: 400, data: { message: "Invalid package" } } },
        "Failed",
      ),
    ).toBe("Invalid package")
  })

  it("uses fallback for empty 500 payloads", () => {
    expect(formatApiError({ response: { status: 500, data: {} } }, "Failed to delete invoice")).toBe(
      "Failed to delete invoice",
    )
  })
})
