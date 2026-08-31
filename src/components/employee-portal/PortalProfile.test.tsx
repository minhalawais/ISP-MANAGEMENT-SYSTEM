import { render, screen, waitFor } from "@testing-library/react"
import { PortalProfile } from "./PortalProfile.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"

jest.mock("../../utils/notify.ts", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}))

jest.mock("../../utils/auth.ts", () => ({
  getToken: () => "test-token",
}))

jest.mock("../../utils/axiosConfig.ts", () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() },
}))

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>

describe("PortalProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockResolvedValue({
      data: {
        id: "employee-1",
        username: "rubas",
        email: "rubas@example.com",
        first_name: "Rubas",
        last_name: "Sajid",
        contact_number: "03001234567",
        cnic: "3520212345671",
        role: "employee",
        is_active: true,
        emergency_contact: "03007654321",
        house_address: "Lahore",
        joining_date: "2026-04-05",
        salary: 50000,
        paid_this_month: 37350,
        hold_money: 150,
        picture: null,
        cnic_image: "uploads/cnic.jpg",
        utility_bill_image: "uploads/bill.jpg",
        reference_name: "Reference Person",
        reference_contact: "03001112222",
        reference_cnic_image: "uploads/reference.jpg",
        created_at: "2026-04-05T00:00:00+05:00",
      },
    })
  })

  it("keeps the self-profile personal and removes financial, reference and document details", async () => {
    render(<PortalProfile />)

    await waitFor(() => expect(screen.getByText("Rubas Sajid")).toBeInTheDocument())
    expect(screen.getByText("Personal information")).toBeInTheDocument()
    expect(screen.getByText("Work information")).toBeInTheDocument()
    expect(screen.getByText("Joining date")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit profile" })).toBeInTheDocument()

    expect(screen.queryByText("Monthly salary")).not.toBeInTheDocument()
    expect(screen.queryByText("Paid this month")).not.toBeInTheDocument()
    expect(screen.queryByText("Hold money")).not.toBeInTheDocument()
    expect(screen.queryByText("Reference")).not.toBeInTheDocument()
    expect(screen.queryByText("Documents")).not.toBeInTheDocument()
  })
})
