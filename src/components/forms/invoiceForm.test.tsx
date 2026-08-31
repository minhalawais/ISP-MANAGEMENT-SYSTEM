import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { SWRConfig } from "swr"
import { InvoiceForm } from "./invoiceForm.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"

jest.mock("../../utils/auth.ts", () => ({
  getToken: () => "test-token",
}))

jest.mock("../../utils/axiosConfig.ts", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}))

jest.mock("../SearchableCustomerSelect.tsx", () => ({
  SearchableCustomerSelect: ({ onCustomerSelect }) => (
    <button type="button" onClick={() => onCustomerSelect?.("c1")}>
      Pick customer
    </button>
  ),
}))

jest.mock("../SearchableInventorySelect.tsx", () => ({
  SearchableInventorySelect: () => <div>Inventory select</div>,
}))

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>

// Each test gets its own SWR cache so a stale /customers/dropdown response
// from a previous test can't mask a fetch that should have happened here.
function renderInvoiceForm(props: Parameters<typeof InvoiceForm>[0]) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <InvoiceForm {...props} />
    </SWRConfig>
  )
}

describe("InvoiceForm multiline builder", () => {
  beforeEach(() => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes("/customers/dropdown")) {
        return Promise.resolve({
          data: [
            {
              id: "c1",
              first_name: "Test",
              last_name: "Customer",
              internet_id: "t1",
              service_plan_price: 2500,
              discount_amount: 200,
            },
          ],
        })
      }
      if (url.includes("/inventory/list")) {
        return Promise.resolve({ data: [] })
      }
      return Promise.resolve({ data: [] })
    })
  })

  it("starts with one subscription line and lets the user add more", async () => {
    const handleInputChange = jest.fn()
    const { container } = renderInvoiceForm({ formData: {}, handleInputChange, isEditing: false })

    await waitFor(() => {
      expect(screen.getByText("Charges")).toBeInTheDocument()
    })

    expect(screen.getByText("Line 1")).toBeInTheDocument()
    expect(screen.queryByText("Line 2")).not.toBeInTheDocument()

    const selects = container.querySelectorAll("select")
    // First select is the optional month picker; charge-type selects follow.
    expect((selects[1] as HTMLSelectElement).value).toBe("subscription")

    fireEvent.click(screen.getByRole("button", { name: /Add line/i }))

    await waitFor(() => {
      expect(screen.getByText("Line 2")).toBeInTheDocument()
      const linesCalls = handleInputChange.mock.calls.filter((c) => c[0]?.target?.name === "lines")
      expect(linesCalls.length).toBeGreaterThan(0)
      const lastLines = linesCalls[linesCalls.length - 1][0].target.value
      expect(lastLines.length).toBe(2)
    })
  })

  it("autofills subscription price and dates when a customer is selected", async () => {
    const handleInputChange = jest.fn()
    renderInvoiceForm({ formData: {}, handleInputChange, isEditing: false })

    const pick = await screen.findByRole("button", { name: /Pick customer/i })
    fireEvent.click(pick)

    await waitFor(() => {
      const linesCalls = handleInputChange.mock.calls.filter((c) => c[0]?.target?.name === "lines")
      expect(linesCalls.length).toBeGreaterThan(0)
      const lastLines = linesCalls[linesCalls.length - 1][0].target.value
      expect(lastLines[0].charge_type).toBe("subscription")
      expect(lastLines[0].unit_price).toBe(2500)
      expect(lastLines[0].discount_amount).toBe(200)
      expect(lastLines[0].description).toBe("Monthly subscription")
      expect(lastLines[0].billing_start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(lastLines[0].billing_end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

      const dueCalls = handleInputChange.mock.calls.filter((c) => c[0]?.target?.name === "due_date")
      expect(dueCalls.length).toBeGreaterThan(0)
      expect(dueCalls[dueCalls.length - 1][0].target.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it("creates one subscription line per package with plan name in description", async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes("/customers/dropdown")) {
        return Promise.resolve({
          data: [
            {
              id: "c1",
              first_name: "Test",
              last_name: "Customer",
              internet_id: "t1",
              service_plan_price: 3500,
              discount_amount: 150,
              installation_date: "2024-03-05",
              packages: [
                {
                  id: "pkg-1",
                  service_plan_id: "sp-1",
                  service_plan_name: "Fiber 50",
                  speed_mbps: 50,
                  price: 3000,
                  discount_amount: 100,
                },
                {
                  id: "pkg-2",
                  service_plan_id: "sp-2",
                  service_plan_name: "IPTV Basic",
                  speed_mbps: null,
                  price: 500,
                  discount_amount: 50,
                },
              ],
            },
          ],
        })
      }
      if (url.includes("/inventory/list")) {
        return Promise.resolve({ data: [] })
      }
      return Promise.resolve({ data: [] })
    })

    const handleInputChange = jest.fn()
    renderInvoiceForm({ formData: {}, handleInputChange, isEditing: false })

    const pick = await screen.findByRole("button", { name: /Pick customer/i })
    fireEvent.click(pick)

    await waitFor(() => {
      const linesCalls = handleInputChange.mock.calls.filter((c) => c[0]?.target?.name === "lines")
      expect(linesCalls.length).toBeGreaterThan(0)
      const lastLines = linesCalls[linesCalls.length - 1][0].target.value
      expect(lastLines).toHaveLength(2)
      expect(lastLines[0]).toMatchObject({
        charge_type: "subscription",
        description: "Fiber 50 - 50Mbps",
        unit_price: 3000,
        discount_amount: 100,
        customer_package_id: "pkg-1",
      })
      expect(lastLines[1]).toMatchObject({
        charge_type: "subscription",
        description: "IPTV Basic",
        unit_price: 500,
        discount_amount: 50,
        customer_package_id: "pkg-2",
      })
      expect(lastLines[0].billing_start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(lastLines[1].billing_end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    expect(screen.getByText("Line 1")).toBeInTheDocument()
    expect(screen.getByText("Line 2")).toBeInTheDocument()
  })

  it("preserves non-subscription lines when expanding packages for a new customer", async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes("/customers/dropdown")) {
        return Promise.resolve({
          data: [
            {
              id: "c1",
              first_name: "Test",
              last_name: "Customer",
              internet_id: "t1",
              service_plan_price: 2000,
              discount_amount: 0,
              packages: [
                {
                  id: "pkg-1",
                  service_plan_id: "sp-1",
                  service_plan_name: "Fiber 20",
                  speed_mbps: 20,
                  price: 2000,
                  discount_amount: 0,
                },
              ],
            },
          ],
        })
      }
      if (url.includes("/inventory/list")) {
        return Promise.resolve({ data: [] })
      }
      return Promise.resolve({ data: [] })
    })

    const handleInputChange = jest.fn()
    renderInvoiceForm({ formData: {}, handleInputChange, isEditing: false })

    await waitFor(() => {
      expect(screen.getByText("Line 1")).toBeInTheDocument()
    })

    // Add a second non-subscription line before picking the customer.
    fireEvent.click(screen.getByRole("button", { name: /Add line/i }))
    await waitFor(() => {
      expect(screen.getByText("Line 2")).toBeInTheDocument()
    })

    const pick = await screen.findByRole("button", { name: /Pick customer/i })
    fireEvent.click(pick)

    await waitFor(() => {
      const linesCalls = handleInputChange.mock.calls.filter((c) => c[0]?.target?.name === "lines")
      const lastLines = linesCalls[linesCalls.length - 1][0].target.value
      expect(lastLines).toHaveLength(2)
      expect(lastLines[0]).toMatchObject({
        charge_type: "subscription",
        customer_package_id: "pkg-1",
        description: "Fiber 20 - 20Mbps",
      })
      expect(lastLines[1].charge_type).toBe("installation")
    })
  })

  it("sets due date and subscription billing dates when a month is selected", async () => {
    const handleInputChange = jest.fn()
    const { container } = renderInvoiceForm({ formData: {}, handleInputChange, isEditing: false })

    await waitFor(() => {
      expect(screen.getByLabelText(/Select billing month/i)).toBeInTheDocument()
    })

    const monthSelect = screen.getByLabelText(/Select billing month/i) as HTMLSelectElement
    fireEvent.change(monthSelect, { target: { value: "03" } })

    const year = new Date().getFullYear()
    await waitFor(() => {
      const dueCalls = handleInputChange.mock.calls.filter((c) => c[0]?.target?.name === "due_date")
      expect(dueCalls.length).toBeGreaterThan(0)
      // No customer selected -> fallback to the 5th of the billing month.
      expect(dueCalls[dueCalls.length - 1][0].target.value).toBe(`${year}-03-05`)

      const linesCalls = handleInputChange.mock.calls.filter((c) => c[0]?.target?.name === "lines")
      expect(linesCalls.length).toBeGreaterThan(0)
      const lastLines = linesCalls[linesCalls.length - 1][0].target.value
      expect(lastLines[0].billing_start_date).toBe(`${year}-03-01`)
      expect(lastLines[0].billing_end_date).toBe(`${year}-03-31`)
    })

    // Sanity: month select is still the first <select>
    expect((container.querySelectorAll("select")[0] as HTMLSelectElement).value).toBe("03")
  })

  it("syncs invoice_type to mixed when charge types differ", async () => {
    const handleInputChange = jest.fn()
    const { container } = renderInvoiceForm({ formData: {}, handleInputChange, isEditing: false })

    await waitFor(() => {
      expect(screen.getByText("Charges")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /Add line/i }))

    await waitFor(() => {
      expect(screen.getByText("Line 2")).toBeInTheDocument()
    })

    // Line 2 defaults to installation; line 1 is subscription → mixed
    await waitFor(() => {
      const typeCalls = handleInputChange.mock.calls.filter((c) => c[0]?.target?.name === "invoice_type")
      expect(typeCalls[typeCalls.length - 1][0].target.value).toBe("mixed")
    })

    const selects = container.querySelectorAll("select")
    // [0]=month, [1]=line1 charge type, [2]=line2 charge type
    expect((selects[2] as HTMLSelectElement).value).toBe("installation")
  })

  it("hides qty for subscription and shows it for equipment", async () => {
    const handleInputChange = jest.fn()
    const { container } = renderInvoiceForm({ formData: {}, handleInputChange, isEditing: false })

    await waitFor(() => {
      expect(screen.getByText("Line 1")).toBeInTheDocument()
    })

    expect(screen.queryByLabelText(/^Qty$/i)).not.toBeInTheDocument()
    expect(screen.queryByText("Qty")).not.toBeInTheDocument()

    const chargeSelect = container.querySelectorAll("select")[1] as HTMLSelectElement
    fireEvent.change(chargeSelect, { target: { value: "equipment" } })

    await waitFor(() => {
      expect(screen.getByText("Qty")).toBeInTheDocument()
    })

    fireEvent.change(chargeSelect, { target: { value: "subscription" } })

    await waitFor(() => {
      expect(screen.queryByText("Qty")).not.toBeInTheDocument()
      const linesCalls = handleInputChange.mock.calls.filter((c) => c[0]?.target?.name === "lines")
      const lastLines = linesCalls[linesCalls.length - 1][0].target.value
      expect(lastLines[0].quantity).toBe(1)
    })
  })
})
