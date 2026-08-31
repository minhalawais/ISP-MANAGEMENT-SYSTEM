import { render, screen, waitFor } from "@testing-library/react"
import { PortalFinancial } from "./PortalFinancial.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"

jest.mock("../../utils/notify.ts", () => ({
  toast: { error: jest.fn() },
}))

jest.mock("../../utils/auth.ts", () => ({
  getToken: () => "test-token",
}))

jest.mock("../../utils/axiosConfig.ts", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>

describe("PortalFinancial", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockResolvedValue({
      data: {
        salary: 50000,
        total_paid: 37350,
        hold_money: 150,
        period: { start: "2026-08-01", end: "2026-08-31", label: "August 2026" },
        ledger: [{
          id: "entry-1",
          transaction_type: "payout",
          amount: -1000,
          description: "Employee payment",
          created_at: "2026-08-18T15:33:00+05:00",
        }],
      },
    })
  })

  it("shows the three approved stats and keeps details in transaction history", async () => {
    render(<PortalFinancial />)

    await waitFor(() => expect(screen.getByText("Financial summary")).toBeInTheDocument())
    expect(screen.getByText("Monthly salary")).toBeInTheDocument()
    expect(screen.getByText("Paid this month")).toBeInTheDocument()
    expect(screen.getByText("Hold money")).toBeInTheDocument()
    expect(screen.getByText("Payout")).toBeInTheDocument()
    expect(screen.queryByText("Current balance")).not.toBeInTheDocument()
    expect(screen.queryByText("Field cash custody")).not.toBeInTheDocument()
    expect(screen.queryByText("Earnings breakdown")).not.toBeInTheDocument()
  })
})
