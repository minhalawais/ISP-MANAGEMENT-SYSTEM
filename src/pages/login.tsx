import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, Lock, User, LogIn } from "lucide-react"
import MBALogo from "../assets/mba_logo.tsx"
import axiosInstance from "../utils/axiosConfig.ts"
const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    document.title = "MBA NET - Login"
  }, [])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
  
    try {
      const response = await axiosInstance.post("/auth/login", {
        username,
        password,
      })
  
      const data = response.data
  
      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.role)
      localStorage.setItem("company_id", data.company_id)
      localStorage.setItem("id", data.id)
  
      if (data.role === "company_owner" || data.role === "super_admin" || data.role === "auditor") {
        navigate("/reporting-analytics")
      } else if (data.role === "employee") {
        navigate("/employee_portal")
      }
    } catch (err: any) {
      console.error("Login failed", err)
      setError("Invalid credentials")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        {/* Glass Effect Card */}
        <div className="backdrop-blur-lg bg-white/80 p-8 rounded-3xl shadow-xl border border-white/20">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4">
              <MBALogo variant="landscape" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-purple-600 group-hover:text-indigo-600 transition-colors duration-200" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
                         transition-all duration-200 ease-in-out
                         hover:bg-white/80"
                placeholder="Username"
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-purple-600 group-hover:text-indigo-600 transition-colors duration-200" />
              </div>
              <input
                type={isPasswordVisible ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 bg-white/50 border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
                         transition-all duration-200 ease-in-out
                         hover:bg-white/80"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 
                         hover:text-purple-600 transition-colors duration-200"
              >
                {isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Error Message */}
            {error && <div className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">{error}</div>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-white font-semibold 
                       bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                       transition duration-300 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                       shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </div>
              )}
            </button>

            {/* Additional Links */}
            <div className="text-center mt-6 space-y-2">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

