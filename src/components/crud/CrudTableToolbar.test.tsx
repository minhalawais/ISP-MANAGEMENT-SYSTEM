import { render, screen, fireEvent } from "@testing-library/react"
import { CrudTableToolbar } from "./CrudTableToolbar.tsx"

const quickFilters = [
  {
    id: "status",
    label: "Status",
    type: "select" as const,
    field: "status",
    placeholder: "All",
    options: [
      { value: "", label: "All" },
      { value: "paid", label: "Paid" },
    ],
  },
]

describe("CrudTableToolbar", () => {
  test("shows active filter chips and clear all", () => {
    render(
      <CrudTableToolbar
        globalSearch=""
        onGlobalSearchChange={jest.fn()}
        quickFilters={quickFilters}
        filterState={{ status: "paid" }}
        onQuickFilterChange={jest.fn()}
        hasActiveFilters
        onClearFilters={jest.fn()}
        showAdvanced={false}
        onToggleAdvanced={jest.fn()}
      />,
    )
    expect(screen.getByText("1 filter applied")).toBeInTheDocument()
    expect(screen.getByText("Clear all")).toBeInTheDocument()
    expect(screen.getByLabelText("Remove Status filter")).toBeInTheDocument()
  })

  test("clear all invokes callback and clears search", () => {
    const onClear = jest.fn()
    const onSearchChange = jest.fn()
    render(
      <CrudTableToolbar
        globalSearch="john"
        onGlobalSearchChange={onSearchChange}
        quickFilters={quickFilters}
        filterState={{ status: "paid" }}
        onQuickFilterChange={jest.fn()}
        hasActiveFilters
        onClearFilters={onClear}
        showAdvanced={false}
        onToggleAdvanced={jest.fn()}
      />,
    )
    fireEvent.click(screen.getByText("Clear all"))
    expect(onClear).toHaveBeenCalled()
    expect(onSearchChange).toHaveBeenCalledWith("")
  })

  test("removing a quick filter chip calls onQuickFilterChange", () => {
    const onQuickChange = jest.fn()
    render(
      <CrudTableToolbar
        globalSearch=""
        onGlobalSearchChange={jest.fn()}
        quickFilters={quickFilters}
        filterState={{ status: "paid" }}
        onQuickFilterChange={onQuickChange}
        hasActiveFilters
        onClearFilters={jest.fn()}
        showAdvanced={false}
        onToggleAdvanced={jest.fn()}
      />,
    )
    fireEvent.click(screen.getByLabelText("Remove Status filter"))
    expect(onQuickChange).toHaveBeenCalledWith("status", null)
  })
})
