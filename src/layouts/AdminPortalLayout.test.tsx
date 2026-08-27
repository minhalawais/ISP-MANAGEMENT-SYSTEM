import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import AdminPortalLayout, { StaffAwareAdminLayout } from "../layouts/AdminPortalLayout.tsx"
import { useOptionalAdminChrome } from "../context/AdminLayoutContext.tsx"

jest.mock("../components/sideNavbar.tsx", () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}))

jest.mock("../components/topNavbar.tsx", () => ({
  Topbar: () => <nav data-testid="topbar">Topbar</nav>,
}))

jest.mock("../utils/auth.ts", () => ({
  getToken: () => "tok",
  getRole: () => "company_owner",
}))

jest.mock("../utils/authRedirects.ts", () => ({
  isAdminPortalRole: () => true,
  LOGIN_ROUTE: "/admin",
}))

function Probe() {
  const chrome = useOptionalAdminChrome()
  return <div>chrome:{chrome ? "yes" : "no"}</div>
}

describe("AdminPortalLayout", () => {
  it("provides chrome to outlet", () => {
    render(
      <MemoryRouter initialEntries={["/x"]}>
        <Routes>
          <Route element={<AdminPortalLayout />}>
            <Route path="/x" element={<Probe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByTestId("sidebar")).toBeInTheDocument()
    expect(screen.getByTestId("topbar")).toBeInTheDocument()
    expect(screen.getByText("chrome:yes")).toBeInTheDocument()
  })

  it("StaffAwareAdminLayout provides chrome for admin", () => {
    render(
      <MemoryRouter initialEntries={["/x"]}>
        <Routes>
          <Route element={<StaffAwareAdminLayout />}>
            <Route path="/x" element={<Probe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText("chrome:yes")).toBeInTheDocument()
  })
})
