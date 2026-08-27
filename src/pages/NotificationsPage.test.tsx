import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import NotificationsPage from "./NotificationsPage.tsx"

const mockNavigate = jest.fn()
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}))

jest.mock("../utils/auth.ts", () => ({
  getRole: () => "company_owner",
}))

jest.mock("../context/CompanyContext.tsx", () => ({
  useCompany: () => ({ setPageTitle: jest.fn() }),
}))

const mockMarkAllRead = jest.fn()
const mockRefreshList = jest.fn()
const mockSetStatusFilter = jest.fn()
const mockMarkRead = jest.fn()

jest.mock("../hooks/useNotifications.ts", () => ({
  useNotifications: () => ({
    items: [
      {
        id: "n1",
        title: "Task assigned to you",
        body: "installation was assigned to you",
        is_read: false,
        deep_link: "/employee-portal?section=tasks",
        created_at: new Date().toISOString(),
      },
    ],
    loading: false,
    statusFilter: "unread",
    setStatusFilter: mockSetStatusFilter,
    refreshList: mockRefreshList,
    markRead: mockMarkRead,
    markAllRead: mockMarkAllRead,
    unreadCount: 1,
  }),
}))

jest.mock("../services/notification.service.ts", () => ({
  fetchNotificationPreferences: jest.fn(),
  updateNotificationPreferences: jest.fn(),
}))

import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "../services/notification.service.ts"

const mockedFetchPrefs = fetchNotificationPreferences as jest.Mock
const mockedUpdatePrefs = updateNotificationPreferences as jest.Mock

describe("NotificationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMarkAllRead.mockResolvedValue(1)
    mockMarkRead.mockResolvedValue(undefined)
    mockedFetchPrefs.mockResolvedValue({
      muted_event_types: [],
      whatsapp_action_required: true,
      known_event_types: [
        { id: "payment.created", label: "Payment recorded" },
      ],
    })
    mockedUpdatePrefs.mockResolvedValue({
      muted_event_types: [],
      whatsapp_action_required: true,
      known_event_types: [
        { id: "payment.created", label: "Payment recorded" },
      ],
    })
  })

  it("renders unread items and mark all read", async () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    expect(screen.getByText("Task assigned to you")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Mark all read"))
    await waitFor(() => expect(mockMarkAllRead).toHaveBeenCalled())
  })

  it("switches to All tab", () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText("All"))
    expect(mockSetStatusFilter).toHaveBeenCalledWith("all")
  })

  it("opens preferences panel", async () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText("Preferences"))
    await waitFor(() => {
      expect(screen.getByText("Mute event types")).toBeInTheDocument()
      expect(screen.getByText("Payment recorded")).toBeInTheDocument()
    })
  })
})
