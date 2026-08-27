import { render, screen, waitFor } from "@testing-library/react"
import { ComplaintFilePreview } from "./ComplaintFilePreview.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}))

jest.mock("../../utils/axiosConfig.ts", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>

describe("ComplaintFilePreview", () => {
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

  it("renders a live image preview for image attachments", async () => {
    mockedAxios.get.mockResolvedValue({ data: new Blob(["img"], { type: "image/png" }) })

    render(
      <ComplaintFilePreview
        label="Complaint attachment"
        filePath="uploads/shot.png"
        fetchUrl="/complaints/attachment/c1"
      />
    )

    expect(screen.getByText("Complaint attachment")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("img", { name: "Complaint attachment" })).toHaveAttribute("src", "blob:preview"))
    expect(mockedAxios.get).toHaveBeenCalledWith("/complaints/attachment/c1", {
      responseType: "blob",
      skipErrorToast: true,
    })
  })

  it("does not fetch a preview for non-image files", () => {
    render(
      <ComplaintFilePreview
        label="Complaint attachment"
        filePath="uploads/notes.pdf"
        fetchUrl="/complaints/attachment/c1"
      />
    )

    expect(screen.getByText("Complaint attachment")).toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(mockedAxios.get).not.toHaveBeenCalled()
  })
})
