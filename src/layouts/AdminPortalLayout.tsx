"use client"

import React, { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { Sidebar } from "../components/sideNavbar.tsx"
import { Topbar } from "../components/topNavbar.tsx"
import { AdminLayoutProvider, useAdminLayout } from "../context/AdminLayoutContext.tsx"
import { getRole, getToken } from "../utils/auth.ts"
import { isAdminPortalRole, LOGIN_ROUTE } from "../utils/authRedirects.ts"

export const AdminPortalChrome: React.FC = () => {
  const layout = useAdminLayout()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  if (!layout) return null

  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar } = layout
  const mainMargin = isMobile ? "ml-0" : isSidebarOpen ? "ml-72" : "ml-20"

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      {/* Full-bleed topbar: logo + hamburger at far left; sidebar starts below */}
      <Topbar toggleSidebar={toggleSidebar} />
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsOpen={setIsSidebarOpen}
      />
      <main
        className={`min-h-screen pt-14 transition-[margin] duration-300 ease-in-out ${mainMargin}`}
      >
        <Outlet />
      </main>
    </div>
  )
}

/** Persistent admin shell: Sidebar + Topbar survive route changes. */
const AdminPortalLayout: React.FC = () => (
  <AdminLayoutProvider>
    <AdminPortalChrome />
  </AdminLayoutProvider>
)

/**
 * Shared parent for admin pages + staff-shared routes.
 * Admins always get chrome (one provider instance across navigations).
 * Employees get a bare Outlet (for /notifications, /invoices/:id).
 */
export const StaffAwareAdminLayout: React.FC = () => {
  if (!getToken()) {
    return <Navigate to={LOGIN_ROUTE} replace />
  }
  if (isAdminPortalRole(getRole())) {
    return (
      <AdminLayoutProvider>
        <AdminPortalChrome />
      </AdminLayoutProvider>
    )
  }
  return <Outlet />
}

export default AdminPortalLayout
