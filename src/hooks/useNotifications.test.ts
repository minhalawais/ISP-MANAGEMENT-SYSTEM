import { renderHook, act, waitFor } from "@testing-library/react"
import { useNotifications } from "./useNotifications.ts"
import * as service from "../services/notification.service.ts"

jest.mock("../services/notification.service.ts", () => ({
  fetchUnreadCount: jest.fn(),
  fetchNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
}))

const mocked = service as jest.Mocked<typeof service>

describe("useNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mocked.fetchUnreadCount.mockResolvedValue(2)
    mocked.fetchNotifications.mockResolvedValue({
      items: [{ id: "n1", title: "t", body: "b", is_read: false } as any],
      total: 1,
    })
    mocked.markNotificationRead.mockResolvedValue({ id: "n1", is_read: true } as any)
    mocked.markAllNotificationsRead.mockResolvedValue(2)
  })

  it("loads unread count on mount", async () => {
    const { result } = renderHook(() => useNotifications({ autoPoll: true }))
    await waitFor(() => expect(result.current.unreadCount).toBe(2))
  })

  it("markAllRead zeroes unread count", async () => {
    const { result } = renderHook(() => useNotifications({ autoPoll: false }))
    await waitFor(() => expect(mocked.fetchUnreadCount).toHaveBeenCalled())
    await act(async () => {
      await result.current.markAllRead()
    })
    expect(result.current.unreadCount).toBe(0)
  })
})
