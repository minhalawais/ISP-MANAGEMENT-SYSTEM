import { render, screen, waitFor, fireEvent, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { PortalTasks } from "./PortalTasks.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts"

jest.mock("../../utils/notify.ts", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}))

jest.mock("../../utils/auth.ts", () => ({
  getToken: () => "test-token",
}))

jest.mock("../../utils/axiosConfig.ts", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}))

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>

const sampleTasks = [
  {
    id: "task-1",
    task_type: "installation",
    priority: "high",
    status: "pending",
    due_date: "2026-09-01T10:00:00Z",
    notes: "Install new router",
    completion_notes: null,
    completion_proof: null,
    created_at: "2026-08-01T10:00:00Z",
    completed_at: null,
    customer_id: "cust-1",
    customer_name: "Abid Majeed",
    customer_phone: "923157897953",
    customer_address: "Street 1",
    customer_area: "National Park",
    customer_internet_id: "abid3-bc-np",
    assignees: [{ id: "emp-1", name: "Ali Tech" }],
    is_unassigned: false,
    is_assignee: true,
    can_update: true,
  },
  {
    id: "task-2",
    task_type: "maintenance",
    priority: "medium",
    status: "in_progress",
    due_date: null,
    notes: null,
    completion_notes: null,
    completion_proof: null,
    created_at: "2026-08-02T10:00:00Z",
    completed_at: null,
    customer_id: "cust-2",
    customer_name: "Ali Asmat",
    customer_phone: "923008438142",
    customer_address: null,
    customer_area: "A-Block Sabzazar",
    customer_internet_id: "ali39a-sz",
    assignees: [{ id: "emp-9", name: "Other Tech" }],
    is_unassigned: false,
    is_assignee: false,
    can_update: false,
  },
]

function renderPortalTasks() {
  return render(
    <MemoryRouter>
      <PortalTasks />
    </MemoryRouter>
  )
}

describe("PortalTasks", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockResolvedValue({ data: sampleTasks })
    mockedAxios.put.mockResolvedValue({ data: {} })
  })

  it("renders a compact list row per task with a stat strip and filters", async () => {
    renderPortalTasks()

    await waitFor(() => expect(screen.getByText("Installation")).toBeInTheDocument())
    expect(screen.getByText("Maintenance")).toBeInTheDocument()
    expect(screen.getByText(/Abid Majeed/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Pending" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "In progress" })).toBeInTheDocument()
  })

  it("opens the detail sheet when a row is tapped", async () => {
    renderPortalTasks()

    await waitFor(() => expect(screen.getByText("Installation")).toBeInTheDocument())
    fireEvent.click(screen.getByText("Installation"))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Install new router")).toBeInTheDocument()
    expect(within(dialog).getByText(/923157897953/)).toBeInTheDocument()
    expect(within(dialog).getByText("Assigned to you")).toBeInTheDocument()
  })

  it("renders task details inline in the desktop panel, not only in the mobile sheet", async () => {
    renderPortalTasks()

    await waitFor(() => expect(screen.getByText("Installation")).toBeInTheDocument())
    expect(screen.getByText("Select a task to view details")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Installation"))

    await screen.findByRole("dialog")
    expect(screen.queryByText("Select a task to view details")).not.toBeInTheDocument()
    expect(screen.getAllByText("Install new router").length).toBeGreaterThan(1)
  })

  it("submits a status update from the sheet when assignee", async () => {
    renderPortalTasks()

    await waitFor(() => expect(screen.getByText("Installation")).toBeInTheDocument())
    fireEvent.click(screen.getByText("Installation"))

    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Update task" }))

    await waitFor(() =>
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/employee-portal/tasks/task-1/status",
        expect.objectContaining({ status: "pending" }),
        expect.anything()
      )
    )
  })

  it("hides update controls for view-only tasks", async () => {
    renderPortalTasks()

    await waitFor(() => expect(screen.getByText("Maintenance")).toBeInTheDocument())
    fireEvent.click(screen.getByText("Maintenance"))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("View only")).toBeInTheDocument()
    expect(within(dialog).queryByRole("button", { name: "Update task" })).not.toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })
})
