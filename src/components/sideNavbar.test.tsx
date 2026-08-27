import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { Sidebar } from "./sideNavbar.tsx"

jest.mock("../utils/auth.ts", () => ({
  removeToken: jest.fn(),
}))

jest.mock("../utils/axiosConfig.ts", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}))

describe("Sidebar", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders frequent pins when expanded", () => {
    render(
      <MemoryRouter initialEntries={["/reporting/executive"]}>
        <Sidebar isOpen toggleSidebar={jest.fn()} setIsOpen={jest.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByText("Frequent")).toBeInTheDocument()
    expect(screen.getAllByText("Customers").length).toBeGreaterThan(0)
  })

  it("opens flyout from collapsed payments icon", () => {
    render(
      <MemoryRouter initialEntries={["/reporting/executive"]}>
        <Sidebar isOpen={false} toggleSidebar={jest.fn()} setIsOpen={jest.fn()} />
      </MemoryRouter>,
    )
    const paymentsGroup = screen.getAllByTitle("Payments").find((el) => el.tagName === "BUTTON")
    expect(paymentsGroup).toBeTruthy()
    fireEvent.click(paymentsGroup!)
    expect(screen.getByText("Expense Management")).toBeInTheDocument()
  })

  it("opens flyout on hover of collapsed group icon", () => {
    render(
      <MemoryRouter initialEntries={["/reporting/executive"]}>
        <Sidebar isOpen={false} toggleSidebar={jest.fn()} setIsOpen={jest.fn()} />
      </MemoryRouter>,
    )
    const paymentsGroup = screen.getAllByTitle("Payments").find((el) => el.tagName === "BUTTON")
    fireEvent.mouseEnter(paymentsGroup!.parentElement!)
    expect(screen.getByText("Expense Management")).toBeInTheDocument()
  })

  it("navigates inventory directly when collapsed (flat link)", () => {
    render(
      <MemoryRouter initialEntries={["/reporting/executive"]}>
        <Sidebar isOpen={false} toggleSidebar={jest.fn()} setIsOpen={jest.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByTitle("Inventory")).toBeInTheDocument()
  })
})
