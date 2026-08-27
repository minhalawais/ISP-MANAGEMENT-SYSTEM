import { render, screen, fireEvent } from "@testing-library/react"
import { PortalSheet } from "./PortalSheet.tsx"

describe("PortalSheet", () => {
  it("renders nothing when closed", () => {
    render(
      <PortalSheet open={false} onClose={jest.fn()} title="Details">
        <p>Body content</p>
      </PortalSheet>
    )

    expect(screen.queryByText("Body content")).not.toBeInTheDocument()
  })

  it("renders title, subtitle, and children when open", () => {
    render(
      <PortalSheet open={true} onClose={jest.fn()} title="Details" subtitle="Extra info">
        <p>Body content</p>
      </PortalSheet>
    )

    expect(screen.getByText("Details")).toBeInTheDocument()
    expect(screen.getByText("Extra info")).toBeInTheDocument()
    expect(screen.getByText("Body content")).toBeInTheDocument()
  })

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn()
    render(
      <PortalSheet open={true} onClose={onClose} title="Details">
        <p>Body content</p>
      </PortalSheet>
    )

    fireEvent.click(screen.getByLabelText("Close"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when the backdrop is clicked but not when the panel is clicked", () => {
    const onClose = jest.fn()
    const { container } = render(
      <PortalSheet open={true} onClose={onClose} title="Details">
        <p>Body content</p>
      </PortalSheet>
    )

    fireEvent.click(screen.getByText("Body content"))
    expect(onClose).not.toHaveBeenCalled()

    const backdrop = container.firstChild as HTMLElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when Escape is pressed", () => {
    const onClose = jest.fn()
    render(
      <PortalSheet open={true} onClose={onClose} title="Details">
        <p>Body content</p>
      </PortalSheet>
    )

    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("renders a footer when provided", () => {
    render(
      <PortalSheet open={true} onClose={jest.fn()} title="Details" footer={<button>Save</button>}>
        <p>Body content</p>
      </PortalSheet>
    )

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })
})
