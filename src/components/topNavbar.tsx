"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Menu, Bell, User, ChevronDown, Settings, LogOut } from "lucide-react"
import { getToken, removeToken } from "../utils/auth.ts"
import { useNavigate } from "react-router-dom"
import axiosInstance from "../utils/axiosConfig.ts"
import MBALogo from "../assets/mba_logo.tsx"

interface TopbarProps {
  toggleSidebar: () => void
}

export const Topbar: React.FC<TopbarProps> = ({ toggleSidebar }) => {
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
      removeToken()
      navigate("/login")
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  return (
    <nav className="bg-white shadow-sm fixed w-full z-40 border-b border-[#EBF5FF]">
      <div className="max-w mx-2 px-2 sm:px-2 lg:px-2">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-[#4A5568] hover:bg-[#EBF5FF] transition-colors duration-200 mr-2"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="h-10 w-32 -mt-1 flex items-center" style={{ width: "193px", height: "56px" }}>
              {/* Assuming MBALogo can handle color variants */}
              <MBALogo variant="landscape" />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button className="relative p-2 text-[#4A5568] hover:bg-[#EBF5FF] rounded-full transition-colors duration-200">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-[#EF4444] rounded-full"></span>
            </button>

            <div className="relative">
              <button
                className="flex items-center space-x-3 text-[#4A5568] hover:bg-[#EBF5FF] p-2 rounded-lg transition-colors duration-200"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-8 h-8 bg-[#3A86FF]/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-[#3A86FF]" />
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
                  <a
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-[#4A5568] hover:bg-[#EBF5FF] hover:text-[#3A86FF] transition-colors duration-150"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Your Profile
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-[#4A5568] hover:bg-[#EBF5FF] hover:text-[#3A86FF] transition-colors duration-150"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </a>
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
