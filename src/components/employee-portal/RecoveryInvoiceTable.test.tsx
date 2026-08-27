import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import {
  RecoveryInvoiceTable,
  RECOVERY_INVOICE_GRID_CLASS,
  RECOVERY_INVOICE_TABLE_CLASS,
} from "./RecoveryInvoiceTable.tsx"

const sample = [
  {
    id: "inv-1",
    invoice_number: "INV-2026-1904",
    invoice_status: "pending",
    invoice_type: "subscription",
    due_date: "2026-03-06",
    billing_start_date: "2026-03-01",
    billing_end_date: "2026-03-31",
    total_amount: 1500,
    paid_amount: 0,
    remaining_amount: 1500,
    customer_name: "Asim Mehboob Qureshi",
    customer_id: "cust-1",
    customer_internet_id: "asim65-bc-np",
    customer_phone: "03001234567",
    customer_area: "National Park",
    customer_sub_zone: "National Park",
  },
]

describe("RecoveryInvoiceTable", () => {
  it("uses CSS grid instead of HTML table (avoids global table.css 60px first-col)", () => {
    expect(RECOVERY_INVOICE_GRID_CLASS).toMatch(/grid-cols-/)
    expect(RECOVERY_INVOICE_TABLE_CLASS).not.toMatch(/table-fixed/)
  })

  it("does not render a table element", () => {
    const { container } = render(
      <MemoryRouter>
        <RecoveryInvoiceTable invoices={sample} onCollect={jest.fn()} />
      </MemoryRouter>
    )
    expect(container.querySelector("table")).toBeNull()
    expect(screen.getByTestId("recovery-invoice-table")).toBeInTheDocument()
  })

  it("renders invoice id and customer without duplicating identical area/sub-zone", () => {
    render(
      <MemoryRouter>
        <RecoveryInvoiceTable invoices={sample} onCollect={jest.fn()} />
      </MemoryRouter>
    )
    expect(screen.getByText("INV-2026-1904")).toBeInTheDocument()
    expect(screen.getByText("Asim Mehboob Qureshi")).toBeInTheDocument()
    expect(screen.getByText("Asim Mehboob Qureshi").closest("a")).toHaveAttribute(
      "href",
      "/employee-portal/customers/cust-1"
    )
    expect(screen.getByText("asim65-bc-np").closest("a")).toHaveAttribute(
      "href",
      "/employee-portal/customers/cust-1"
    )
    expect(screen.getByText("National Park")).toBeInTheDocument()
    expect(screen.queryByText(/National Park · National Park/)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Collect" })).toBeInTheDocument()
    expect(screen.getByText("subscription")).toBeInTheDocument()
  })

  it("shows mixed charge summary for multi-line invoices", () => {
    render(
      <MemoryRouter>
        <RecoveryInvoiceTable
          invoices={[
            {
              ...sample[0],
              id: "inv-2",
              invoice_number: "INV-2026-1905",
              invoice_type: "mixed",
              charge_types: ["installation", "subscription"],
            },
          ]}
          onCollect={jest.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/installation \+ subscription/i)).toBeInTheDocument()
  })
})
