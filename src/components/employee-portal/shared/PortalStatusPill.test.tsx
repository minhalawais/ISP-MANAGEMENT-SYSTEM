import { render, screen } from "@testing-library/react"
import { AlertCircle } from "lucide-react"
import { PortalStatStrip } from "./PortalStatStrip.tsx"
import { PortalStatusPill, portalStatusLabel } from "./PortalStatusPill.tsx"

describe("PortalStatStrip", () => {
  it("renders tinted KPI cards with labels and values", () => {
    render(
      <PortalStatStrip
        items={[
          { key: "open", label: "Open", value: 3, icon: AlertCircle, tone: "danger" },
          { key: "resolved", label: "Resolved", value: 12, tone: "success" },
        ]}
      />
    )
    expect(screen.getByText("Open")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("Resolved")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
  })
})

describe("PortalStatusPill", () => {
  it("renders a labeled pill with icon for known statuses", () => {
    render(<PortalStatusPill status="in_progress" />)
    expect(screen.getByText("In Progress")).toBeInTheDocument()
    expect(portalStatusLabel("resolved")).toBe("Resolved")
  })
})
