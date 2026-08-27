import { render, screen, waitFor, fireEvent, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import EmployeePortal from "./EmployeePortal.tsx"
import axiosInstance from "../utils/axiosConfig.ts"

jest.mock("../utils/auth.ts", () => ({
  getToken: () => "test-token",
  removeToken: jest.fn(),
}))

jest.mock("../utils/axiosConfig.ts", () => ({
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

jest.mock("../components/notifications/NotificationBell.tsx", () => ({
  NotificationBell: () => <button aria-label="Notifications">Bell</button>,
}))

jest.mock("../components/employee-portal/PortalDashboard.tsx", () => ({
  PortalDashboard: () => <div>Dashboard content</div>,
}))
jest.mock("../components/employee-portal/PortalProfile.tsx", () => ({
  PortalProfile: () => <div>Profile content</div>,
}))
jest.mock("../components/employee-portal/PortalTasks.tsx", () => ({
  PortalTasks: () => <div>Tasks content</div>,
}))
jest.mock("../components/employee-portal/PortalComplaints.tsx", () => ({
  PortalComplaints: () => <div>Complaints content</div>,
}))
jest.mock("../components/employee-portal/PortalCustomers.tsx", () => ({
  PortalCustomers: () => <div>Customers content</div>,
}))
jest.mock("../components/employee-portal/PortalFinancial.tsx", () => ({
  PortalFinancial: () => <div>Financial content</div>,
}))
jest.mock("../components/employee-portal/PortalInventory.tsx", () => ({
  PortalInventory: () => <div>Inventory content</div>,
}))
jest.mock("../components/employee-portal/PortalRecoveries.tsx", () => ({
  PortalRecoveries: () => <div>Recoveries content</div>,
}))

const sampleProfile = {
  id: "emp-1",
  username: "jdoe",
  email: "jdoe@example.com",
  first_name: "Jane",
  last_name: "Doe",
  role: "technician",
  picture: null,
}

describe("EmployeePortal shell navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    mockedAxios.get.mockResolvedValue({ data: sampleProfile })
  })

  it("renders a bottom tab bar with primary sections and a More tab", async () => {
    render(
      <MemoryRouter>
        <EmployeePortal />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Dashboard content")).toBeInTheDocument())

    expect(screen.getAllByRole("navigation").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0)
    expect(screen.getAllByText("My Tasks").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Customers").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Recoveries").length).toBeGreaterThan(0)
    expect(screen.getByText("More")).toBeInTheDocument()
  })

  it("switches sections when a bottom tab is tapped", async () => {
    render(
      <MemoryRouter>
        <EmployeePortal />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Dashboard content")).toBeInTheDocument())

    fireEvent.click(screen.getAllByText("My Tasks")[0])

    await waitFor(() => expect(screen.getByText("Tasks content")).toBeInTheDocument())
  })

  it("opens the More sheet with remaining sections and a logout action", async () => {
    render(
      <MemoryRouter>
        <EmployeePortal />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Dashboard content")).toBeInTheDocument())

    fireEvent.click(screen.getByText("More"))

    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Complaints")).toBeInTheDocument()
    expect(within(dialog).getByText("Financial")).toBeInTheDocument()
    expect(within(dialog).getByText("Inventory")).toBeInTheDocument()
    expect(within(dialog).getByText("My Profile")).toBeInTheDocument()
    expect(within(dialog).getByText("Logout")).toBeInTheDocument()
  })

  it("navigates to a section from the More sheet and closes it", async () => {
    render(
      <MemoryRouter>
        <EmployeePortal />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Dashboard content")).toBeInTheDocument())

    fireEvent.click(screen.getByText("More"))
    fireEvent.click(within(screen.getByRole("dialog")).getByText("Financial"))

    await waitFor(() => expect(screen.getByText("Financial content")).toBeInTheDocument())
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens the section from the URL query", async () => {
    render(
      <MemoryRouter initialEntries={["/employee-portal?section=complaints"]}>
        <EmployeePortal />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Complaints content")).toBeInTheDocument())
  })

  it("restores the last section from session storage when the URL has none", async () => {
    sessionStorage.setItem("employee-portal-section", "customers")

    render(
      <MemoryRouter initialEntries={["/employee-portal"]}>
        <EmployeePortal />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Customers content")).toBeInTheDocument())
  })

  it("persists the selected section so returning to the portal reopens it", async () => {
    render(
      <MemoryRouter initialEntries={["/employee-portal"]}>
        <EmployeePortal />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Dashboard content")).toBeInTheDocument())

    fireEvent.click(screen.getAllByText("My Tasks")[0])

    await waitFor(() => expect(screen.getByText("Tasks content")).toBeInTheDocument())
    expect(sessionStorage.getItem("employee-portal-section")).toBe("tasks")
  })
})
