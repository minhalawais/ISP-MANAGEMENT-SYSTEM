import { render, screen, fireEvent } from "@testing-library/react"
import { CrudPeriodFilter } from "./CrudPeriodFilter.tsx"

describe("CrudPeriodFilter", () => {
  test("shows All label when inactive", () => {
    render(
      <CrudPeriodFilter
        period={null}
        label="All"
        isActive={false}
        onSetPeriod={jest.fn()}
        onSetAll={jest.fn()}
      />,
    )
    expect(screen.getByText("All")).toBeInTheDocument()
  })

  test("opens popover and applies All time", () => {
    const onSetAll = jest.fn()
    render(
      <CrudPeriodFilter
        period={{ year: 2026, month: 8 }}
        label="Aug 2026"
        isActive
        onSetPeriod={jest.fn()}
        onSetAll={onSetAll}
      />,
    )
    fireEvent.click(screen.getByRole("button", { expanded: false }))
    fireEvent.click(screen.getByText("All time"))
    expect(onSetAll).toHaveBeenCalled()
  })
})
