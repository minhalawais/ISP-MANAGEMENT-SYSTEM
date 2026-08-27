import { render, screen, waitFor, fireEvent, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { PortalComplaints } from "./PortalComplaints.tsx"
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
    put: jest.fn(),
  },
}))

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>

const sampleComplaints = [
  {
    id: "comp-1",
    ticket_number: "TCK-1001",
    description: "No internet connectivity since morning",
    status: "open",
    created_at: "2026-08-01T10:00:00Z",
    updated_at: null,
    resolved_at: null,
    response_due_date: "2026-08-03T10:00:00Z",
    resolution_attempts: 0,
    satisfaction_rating: null,
    resolution_proof: null,
    remarks: null,
    attachment_path: null,
    feedback_comments: null,
    customer_id: "cust-1",
    customer_name: "Abid Majeed",
    customer_phone: "923157897953",
    customer_address: "Street 1",
    customer_area: "National Park",
    customer_internet_id: "abid3-bc-np",
    assigned_to: "emp-1",
    assigned_to_name: "You",
    is_unassigned: false,
    is_assignee: true,
    can_update: true,
  },
  {
    id: "comp-2",
    ticket_number: "TCK-1002",
    description: "Billing discrepancy",
    status: "resolved",
    created_at: "2026-08-02T10:00:00Z",
    updated_at: null,
    resolved_at: "2026-08-03T10:00:00Z",
    response_due_date: null,
    resolution_attempts: 1,
    satisfaction_rating: 4,
    resolution_proof: null,
    remarks: "Adjusted invoice",
    attachment_path: null,
    feedback_comments: null,
    customer_id: "cust-2",
    customer_name: "Ali Asmat",
    customer_phone: "923008438142",
    customer_address: null,
    customer_area: "A-Block Sabzazar",
    customer_internet_id: "ali39a-sz",
    assigned_to: "emp-1",
    assigned_to_name: "You",
    is_unassigned: false,
    is_assignee: true,
    can_update: true,
  },
]

function renderComplaints() {
  return render(
    <MemoryRouter>
      <PortalComplaints />
    </MemoryRouter>
  )
}

describe("PortalComplaints", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockResolvedValue({ data: sampleComplaints })
    mockedAxios.put.mockResolvedValue({ data: {} })
  })

  it("renders a compact list row per complaint with a stat strip and filters", async () => {
    renderComplaints()

    await waitFor(() => expect(screen.getByText("TCK-1001")).toBeInTheDocument())
    expect(screen.getByText("TCK-1002")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Resolved" })).toBeInTheDocument()
  })

  it("opens the detail sheet when a row is tapped", async () => {
    renderComplaints()

    await waitFor(() => expect(screen.getByText("TCK-1001")).toBeInTheDocument())
    fireEvent.click(screen.getByText("TCK-1001"))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("No internet connectivity since morning")).toBeInTheDocument()
    expect(within(dialog).getByText(/923157897953/)).toBeInTheDocument()
    expect(within(dialog).getByRole("link", { name: "Abid Majeed" })).toHaveAttribute(
      "href",
      "/employee-portal/customers/cust-1"
    )
    expect(within(dialog).getByRole("link", { name: "abid3-bc-np" })).toHaveAttribute(
      "href",
      "/employee-portal/customers/cust-1"
    )
  })

  it("renders complaint details inline in the desktop panel, not only in the mobile sheet", async () => {
    renderComplaints()

    await waitFor(() => expect(screen.getByText("TCK-1001")).toBeInTheDocument())
    expect(screen.getByText("Select a complaint to view details")).toBeInTheDocument()

    fireEvent.click(screen.getByText("TCK-1001"))

    await screen.findByRole("dialog")
    expect(screen.queryByText("Select a complaint to view details")).not.toBeInTheDocument()
    expect(screen.getAllByText("No internet connectivity since morning").length).toBeGreaterThan(1)
  })

  it("submits a status update from the sheet", async () => {
    renderComplaints()

    await waitFor(() => expect(screen.getByText("TCK-1001")).toBeInTheDocument())
    fireEvent.click(screen.getByText("TCK-1001"))

    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Update complaint" }))

    await waitFor(() =>
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/employee-portal/complaints/comp-1/status",
        expect.objectContaining({ status: "open" }),
        expect.anything()
      )
    )
    expect(mockedAxios.put.mock.calls[0][1]).not.toHaveProperty("resolution_proof")
  })

  it("uploads a resolution proof image instead of asking for a URL", async () => {
    const createObjectURL = jest.fn(() => "blob:proof-preview")
    const revokeObjectURL = jest.fn()
    Object.defineProperty(window.URL, "createObjectURL", { writable: true, value: createObjectURL })
    Object.defineProperty(window.URL, "revokeObjectURL", { writable: true, value: revokeObjectURL })

    renderComplaints()

    await waitFor(() => expect(screen.getByText("TCK-1001")).toBeInTheDocument())
    fireEvent.click(screen.getByText("TCK-1001"))

    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByDisplayValue("Open"), { target: { value: "resolved" } })

    expect(within(dialog).queryByPlaceholderText("https://...")).not.toBeInTheDocument()
    const file = new File(["proof"], "site-photo.png", { type: "image/png" })
    fireEvent.change(within(dialog).getByLabelText("Upload resolution proof"), {
      target: { files: [file] },
    })

    fireEvent.click(within(dialog).getByRole("button", { name: "Update complaint" }))

    await waitFor(() => expect(mockedAxios.put).toHaveBeenCalled())
    const [, body] = mockedAxios.put.mock.calls[0]
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get("status")).toBe("resolved")
    expect((body as FormData).get("resolution_proof")).toBeInstanceOf(File)
  })

  it("shows attachment and proof in the detail pane only when files exist", async () => {
    Object.defineProperty(window.URL, "createObjectURL", {
      writable: true,
      value: jest.fn(() => "blob:preview"),
    })
    Object.defineProperty(window.URL, "revokeObjectURL", {
      writable: true,
      value: jest.fn(),
    })

    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes("/attachment") || url.includes("/resolution-proof")) {
        return Promise.resolve({ data: new Blob(["img"], { type: "image/png" }) })
      }
      return Promise.resolve({
        data: [
          {
            ...sampleComplaints[1],
            attachment_path: "uploads/shot.png",
            resolution_proof: "uploads/proof.jpg",
          },
        ],
      })
    })

    renderComplaints()

    await waitFor(() => expect(screen.getByText("TCK-1002")).toBeInTheDocument())
    fireEvent.click(screen.getByText("TCK-1002"))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Complaint attachment")).toBeInTheDocument()
    expect(within(dialog).getByText("Resolution proof")).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getAllByRole("img").length).toBeGreaterThanOrEqual(2))
  })

  it("does not render attachments in the detail pane when none exist", async () => {
    renderComplaints()

    await waitFor(() => expect(screen.getByText("TCK-1001")).toBeInTheDocument())
    fireEvent.click(screen.getByText("TCK-1001"))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).queryByText("Complaint attachment")).not.toBeInTheDocument()
    expect(within(dialog).queryByText("Resolution proof")).not.toBeInTheDocument()
  })

  it("hides update controls when the employee is not the assignee", async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          ...sampleComplaints[0],
          assigned_to: "other-emp",
          assigned_to_name: "Other Tech",
          is_assignee: false,
          can_update: false,
          is_unassigned: false,
        },
      ],
    })

    renderComplaints()

    await waitFor(() => expect(screen.getByText("TCK-1001")).toBeInTheDocument())
    expect(screen.getByText("View")).toBeInTheDocument()
    fireEvent.click(screen.getByText("TCK-1001"))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("View only")).toBeInTheDocument()
    expect(within(dialog).getByText(/only the assigned technician can update/i)).toBeInTheDocument()
    expect(within(dialog).queryByRole("button", { name: "Update complaint" })).not.toBeInTheDocument()
    expect(within(dialog).queryByText("Update complaint")).not.toBeInTheDocument()
  })
})
