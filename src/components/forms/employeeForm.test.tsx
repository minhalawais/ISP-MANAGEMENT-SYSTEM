import React, { useState } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { EmployeeForm } from "./employeeForm.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"

jest.mock("lodash", () => ({
  debounce: (fn: any) => fn,
}))

jest.mock("../../utils/auth.ts", () => ({
  getToken: () => "test-token",
}))

jest.mock("../../utils/axiosConfig.ts", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>

const renderEmployeeForm = () => {
  const Wrapper = () => {
    const [formData, setFormData] = useState<any>({})

    return (
      <EmployeeForm
        formData={formData}
        handleInputChange={(event) => {
          setFormData((prev: any) => ({
            ...prev,
            [event.target.name]: event.target.value,
          }))
        }}
        handleFileChange={jest.fn()}
        isEditing={false}
        onValidationStateChange={jest.fn()}
      />
    )
  }

  return render(<Wrapper />)
}

describe("EmployeeForm contact validation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.post.mockResolvedValue({ data: { available: true } })
    mockedAxios.get.mockResolvedValue({ data: { available: true } })
  })

  it("formats employee mobile fields while typing", () => {
    renderEmployeeForm()

    fireEvent.change(screen.getByLabelText(/Contact Number/i), {
      target: { name: "contact_number", value: "03001234567" },
    })
    fireEvent.change(screen.getByLabelText(/Emergency Contact/i), {
      target: { name: "emergency_contact", value: "+923007654321" },
    })
    fireEvent.change(screen.getByLabelText(/Reference Contact/i), {
      target: { name: "reference_contact", value: "3001112222" },
    })

    expect(screen.getByLabelText(/Contact Number/i)).toHaveValue("+92 (300)-1234567")
    expect(screen.getByLabelText(/Emergency Contact/i)).toHaveValue("+92 (300)-7654321")
    expect(screen.getByLabelText(/Reference Contact/i)).toHaveValue("+92 (300)-1112222")
  })

  it("limits CNIC to 13 digits and shows an inline validation error", () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}))
    renderEmployeeForm()

    fireEvent.change(screen.getByLabelText(/CNIC Number/i), {
      target: { name: "cnic", value: "12345-1234567-1999" },
    })

    expect(screen.getByLabelText(/CNIC Number/i)).toHaveValue("1234512345671")

    fireEvent.change(screen.getByLabelText(/CNIC Number/i), {
      target: { name: "cnic", value: "12345" },
    })

    expect(screen.getByText("CNIC must be exactly 13 digits")).toBeInTheDocument()
  })

  it("shows duplicate CNIC availability errors from the backend", async () => {
    mockedAxios.get.mockResolvedValue({ data: { available: false } })
    renderEmployeeForm()

    fireEvent.change(screen.getByLabelText(/CNIC Number/i), {
      target: { name: "cnic", value: "1234512345671" },
    })

    await waitFor(() => {
      expect(screen.getByText("CNIC is already in use")).toBeInTheDocument()
    })
  })
})
