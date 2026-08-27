import { render, screen, fireEvent } from "@testing-library/react"
import { Users, CheckCircle2 } from "lucide-react"
import { CrudStatCards } from "./CrudStatCards.tsx"
import type { StatCardDef } from "../../types/crudFilters.ts"

const cards: StatCardDef[] = [
  {
    id: "total",
    label: "Total Customers",
    value: 10,
    tone: "neutral",
    icon: Users,
    filter: { field: "is_active", value: null },
    clearFields: ["is_active"],
  },
  {
    id: "active",
    label: "Active Customers",
    value: 8,
    tone: "success",
    icon: CheckCircle2,
    filter: { field: "is_active", value: true },
  },
]

describe("CrudStatCards", () => {
  test("clicking stat card calls handler", () => {
    const onStatClick = jest.fn()
    render(<CrudStatCards cards={cards} activeStatId={null} onStatClick={onStatClick} />)

    fireEvent.click(screen.getByRole("button", { name: /Active Customers/i }))
    expect(onStatClick).toHaveBeenCalledWith(expect.objectContaining({ id: "active" }))
  })

  test("active card shows selected styling", () => {
    render(<CrudStatCards cards={cards} activeStatId="active" onStatClick={jest.fn()} />)
    expect(screen.getByRole("button", { name: /Active Customers/i }).className).toMatch(/ring-electric-blue/)
  })
})
