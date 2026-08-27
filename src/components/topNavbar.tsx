"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Menu, User, ChevronDown, Settings, LogOut } from "lucide-react"
import { getToken, removeToken, getAssetUrl } from "../utils/auth.ts"
import { useNavigate } from "react-router-dom"
import axiosInstance from "../utils/axiosConfig.ts"
import MBALogo from "../assets/mba_logo.tsx"
import { LOGIN_ROUTE } from "../utils/authRedirects.ts"
import { NotificationBell } from "./notifications/NotificationBell.tsx"

import { useCompany } from "../context/CompanyContext.tsx"

interface TopbarProps {
  toggleSidebar: () => void
}

export const Topbar: React.FC<TopbarProps> = ({ toggleSidebar }) => {
  const { company } = useCompany()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setUserData(response.data)
    } catch (error) {
      console.error("Failed to fetch user data", error)
    }
  }

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout")
    } catch (error) {
      console.error("Logout API call failed", error)
    } finally {
      // Always clear token and redirect, even if API fails
      removeToken()
      localStorage.clear()
      setIsProfileOpen(false)
      navigate(LOGIN_ROUTE)
    }
  }

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-40 border-b border-[#EBF5FF]">
      <div className="px-2 sm:px-3">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              title="Expand or collapse sidebar"
              className="p-2 rounded-md text-[#4A5568] hover:bg-[#EBF5FF] transition-colors duration-200 mr-2 flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="h-10 flex items-center gap-3">
              {company?.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-9 max-w-[160px] object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : company?.name ? (
                <span className="font-bold text-base text-[#2A5C8A] tracking-tight">{company.name}</span>
              ) : null}
              <div className="h-5 w-px bg-slate-200" />
              <div className="h-10 flex items-center">
                <MBALogo variant="navbar" />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <NotificationBell />
            <div className="relative">
              <button
                className="flex items-center space-x-3 text-[#4A5568] hover:bg-[#EBF5FF] p-2 rounded-lg transition-colors duration-200"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#3A86FF]/10 flex items-center justify-center flex-shrink-0 border border-slate-200">
                  {userData?.picture ? (
                    <img
                      src={getAssetUrl(userData.picture)!}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <User className="h-5 w-5 text-[#3A86FF]" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-[#2A5C8A]">
                    {userData?.first_name} {userData?.last_name}
                  </p>
                  <p className="text-xs text-[#4A5568]/70">{userData?.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-[#4A5568]/80" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-[#EBF5FF]">
                  <button
                    onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-[#4A5568] hover:bg-[#EBF5FF] hover:text-[#3A86FF] transition-colors duration-150"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Your Profile
                  </button>
                  <div className="h-px bg-[#EBF5FF] my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors duration-150"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
