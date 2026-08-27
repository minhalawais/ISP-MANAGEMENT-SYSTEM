import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  notificationsStreamUrl,
} from "./notification.service.ts"
import axiosInstance from "../utils/axiosConfig.ts"

jest.mock("../utils/auth.ts", () => ({
  getToken: () => "tok",
}))

jest.mock("../utils/axiosConfig.ts", () => ({
  __esModule: true,
  default: {
    defaults: { baseURL: "http://api.test" },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}))

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>

describe("notification.service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("fetchNotifications passes status and page params", async () => {
    mockedAxios.get.mockResolvedValue({ data: { items: [], total: 0 } })
    await fetchNotifications({ status: "unread", page: 2, page_size: 10 })
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/notifications",
      expect.objectContaining({
        params: { status: "unread", page: 2, page_size: 10 },
      }),
    )
  })

  it("fetchUnreadCount returns count", async () => {
    mockedAxios.get.mockResolvedValue({ data: { count: 7 } })
    await expect(fetchUnreadCount()).resolves.toBe(7)
  })

  it("markNotificationRead posts to id path", async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: "n1", is_read: true } })
    await markNotificationRead("n1")
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/notifications/n1/read",
      null,
      expect.any(Object),
    )
  })

  it("markAllNotificationsRead returns updated", async () => {
    mockedAxios.post.mockResolvedValue({ data: { updated: 4 } })
    await expect(markAllNotificationsRead()).resolves.toBe(4)
  })

  it("fetchNotificationPreferences hits preferences endpoint", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        muted_event_types: [],
        whatsapp_action_required: true,
        known_event_types: [],
      },
    })
    await fetchNotificationPreferences()
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/notifications/preferences",
      expect.any(Object),
    )
  })

  it("updateNotificationPreferences puts payload", async () => {
    mockedAxios.put.mockResolvedValue({
      data: {
        muted_event_types: ["payment.created"],
        whatsapp_action_required: false,
        known_event_types: [],
      },
    })
    await updateNotificationPreferences({ muted_event_types: ["payment.created"] })
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "/notifications/preferences",
      { muted_event_types: ["payment.created"] },
      expect.any(Object),
    )
  })

  it("notificationsStreamUrl includes token", () => {
    expect(notificationsStreamUrl()).toBe(
      "http://api.test/notifications/stream?token=tok",
    )
  })
})
