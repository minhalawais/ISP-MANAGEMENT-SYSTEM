import { render, screen, waitFor } from "@testing-library/react"
import { ComplaintViewModal } from "./ComplaintViewModal.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"

jest.mock("../../utils/axiosConfig.ts", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>

const sampleComplaint = {
  id: "c-1",
  ticket_number: "TKT-260822-11b-02",
  customer_name: "Test User",
  internet_id: "test-1",
  phone_number: "03001234567",
  category: "other",
  category_label: "Other",
  description: "Line is down",
  status: "resolved",
  assigned_to: "u-1",
  assigned_to_name: "Jane",
  is_unassigned: false,
  visible_to: [
    { id: "u-1", name: "Jane", role: "technician", is_assignee: true },
    { id: "u-2", name: "Bob", role: "employee", is_assignee: false },
  ],
  activity: [
    {
      id: "log-1",
      action: "STATUS",
      actor_name: "Jane",
      created_at: "2026-08-23T04:00:00Z",
      summary: "Status changed to resolved",
    },
  ],
  created_at: "2026-08-23T02:16:05Z",
  updated_at: null,
  resolved_at: "2026-08-23T04:00:00Z",
  response_due_date: null,
  satisfaction_rating: null,
  resolution_attempts: 1,
  attachment_path: "uploads/shot.png",
  resolution_proof: "uploads/proof.jpg",
  feedback_comments: null,
  remarks: "Fixed on site",
}

describe("ComplaintViewModal", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window.URL, "createObjectURL", {
      writable: true,
      value: jest.fn(() => "blob:preview"),
    })
    Object.defineProperty(window.URL, "revokeObjectURL", {
      writable: true,
      value: jest.fn(),
    })
  })

  it("shows live image previews for attachment and proof when present", async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === "/complaints/c-1") return Promise.resolve({ data: sampleComplaint })
      return Promise.resolve({ data: new Blob(["img"], { type: "image/png" }) })
    })

    render(<ComplaintViewModal complaintId="c-1" onClose={() => undefined} />)

    await waitFor(() => expect(screen.getByText("Complaint attachment")).toBeInTheDocument())
    expect(screen.getByText("Resolution proof")).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole("img").length).toBe(2))
  })

  it("hides the attachments section when neither file exists", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { ...sampleComplaint, attachment_path: null, resolution_proof: null },
    })

    render(<ComplaintViewModal complaintId="c-1" onClose={() => undefined} />)

    await waitFor(() => expect(screen.getByText("Line is down")).toBeInTheDocument())
    expect(screen.queryByText("Attachments")).not.toBeInTheDocument()
    expect(screen.queryByText("Complaint attachment")).not.toBeInTheDocument()
  })

  it("shows visible_to viewers, assignee badge, and activity", async () => {
    mockedAxios.get.mockResolvedValue({ data: sampleComplaint })

    render(<ComplaintViewModal complaintId="c-1" onClose={() => undefined} />)

    await waitFor(() => expect(screen.getByText("Visible to")).toBeInTheDocument())
    expect(screen.getAllByText("Jane").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Bob")).toBeInTheDocument()
    expect(screen.getByText("Assignee")).toBeInTheDocument()
    expect(screen.getByText("Viewer")).toBeInTheDocument()
    expect(screen.getByText("Activity")).toBeInTheDocument()
    expect(screen.getByText("Status changed to resolved")).toBeInTheDocument()
  })

  it("highlights unassigned complaints that need assignment", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ...sampleComplaint,
        assigned_to: null,
        assigned_to_name: null,
        is_unassigned: true,
        visible_to: [],
        activity: [],
      },
    })

    render(<ComplaintViewModal complaintId="c-1" onClose={() => undefined} />)

    await waitFor(() => expect(screen.getByText("Needs assignment")).toBeInTheDocument())
    expect(screen.getByText("Unassigned")).toBeInTheDocument()
  })
})
