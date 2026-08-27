import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { PortalCustomers } from "./PortalCustomers.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}))

jest.mock("../../utils/auth.ts", () => ({
  getToken: () => "test-token",
}))

jest.mock("../../utils/axiosConfig.ts", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}))

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>

const mockNavigate = jest.fn()
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}))

const sampleCustomers = [
  {
    id: "cust-1",
    internet_id: "abid3-bc-np",
    first_name: "Abid",
    last_name: "Majeed",
    email: null,
    phone_1: "923157897953",
    phone_2: null,
    cnic: null,
    installation_address: null,
    area: "National Park",
    sub_zone: "National Park 2 Splitter",
    isp_name: "National Broadband",
    connection_type: "internet",
    is_active: false,
    installation_date: "2025-07-02",
    total_due: 16000,
  },
  {
    id: "cust-2",
    internet_id: "ali39a-sz",
    first_name: "Ali",
    last_name: "Asmat",
    email: null,
    phone_1: "923008438142",
    phone_2: null,
    cnic: null,
    installation_address: null,
    area: "A-Block Sabzazar",
    sub_zone: "A-Block Sabzazar",
    isp_name: "VNET",
    connection_type: "internet",
    is_active: true,
    installation_date: "2026-07-07",
    total_due: 0,
  },
]

describe("PortalCustomers", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockResolvedValue({ data: sampleCustomers })
  })

  it("renders a compact contact-list row per customer (no boxed detail cards)", async () => {
    render(
      <MemoryRouter>
        <PortalCustomers />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Abid Majeed")).toBeInTheDocument())
    expect(screen.getByText("Ali Asmat")).toBeInTheDocument()
    expect(screen.getByText(/abid3-bc-np/)).toBeInTheDocument()
    expect(screen.getByText("Inactive")).toBeInTheDocument()
    expect(screen.getAllByText("PKR 16,000").length).toBeGreaterThan(0)
    expect(screen.getByText("Paid")).toBeInTheDocument()
  })

  it("shows a single summary strip with total, active, and due", async () => {
    render(
      <MemoryRouter>
        <PortalCustomers />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Abid Majeed")).toBeInTheDocument())
    expect(screen.getByText("Total")).toBeInTheDocument()
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0)
    expect(screen.getByText("Due")).toBeInTheDocument()
    expect(screen.getAllByText("PKR 16,000").length).toBeGreaterThan(0)
  })

  it("navigates straight to the full profile on row tap (no intermediate modal)", async () => {
    render(
      <MemoryRouter>
        <PortalCustomers />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Abid Majeed")).toBeInTheDocument())
    fireEvent.click(screen.getByText("Abid Majeed"))

    expect(mockNavigate).toHaveBeenCalledWith("/employee-portal/customers/cust-1")
    expect(screen.queryByText("Customer Details")).not.toBeInTheDocument()
  })

  it("does not navigate when tapping the inline call action", async () => {
    render(
      <MemoryRouter>
        <PortalCustomers />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Abid Majeed")).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText("Call Abid"))

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("filters via the active/inactive segmented control", async () => {
    render(
      <MemoryRouter>
        <PortalCustomers />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Abid Majeed")).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: "active" }))

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenLastCalledWith(
        expect.stringContaining("is_active=true"),
        expect.anything()
      )
    )
  })
})
