import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { NotificationBell } from "./NotificationBell.tsx"

const mockNavigate = jest.fn()
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}))

const mockMarkRead = jest.fn()
const mockRefreshList = jest.fn()
const mockRefreshUnread = jest.fn()

jest.mock("../../hooks/useNotifications.ts", () => ({
  useNotifications: () => ({
    unreadCount: 3,
    items: [
      {
        id: "n1",
        title: "Payment recorded",
        body: "PKR 5,000 for INV-1",
        is_read: false,
        deep_link: "/payment-management",
        created_at: new Date().toISOString(),
      },
    ],
    refreshList: mockRefreshList,
    refreshUnread: mockRefreshUnread,
    markRead: mockMarkRead,
  }),
}))

describe("NotificationBell", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("shows unread badge", () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    )
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("opens dropdown and navigates on item click", async () => {
    mockMarkRead.mockResolvedValue(undefined)
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByLabelText("Notifications"))
    expect(screen.getByText("Payment recorded")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Payment recorded"))
    await waitFor(() => {
      expect(mockMarkRead).toHaveBeenCalledWith("n1")
      expect(mockNavigate).toHaveBeenCalledWith("/payment-management")
    })
  })

  it("navigates to full inbox from View all", () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByLabelText("Notifications"))
    fireEvent.click(screen.getByText("View all"))
    expect(mockNavigate).toHaveBeenCalledWith("/notifications")
  })
})
