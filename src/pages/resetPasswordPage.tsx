import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Lock } from "lucide-react"
import axios from "axios"
import axiosInstance from "../utils/axiosConfig.ts"

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()

  useEffect(() => {
    const validateToken = async () => {
      try {
        await axiosInstance.get(`/auth/reset-password/${token}`);
      } catch (err) {
        setIsValidToken(false);
        if (axios.isAxiosError(err) && err.response) {
          setError(err.response.data.error || "Invalid or expired token");
        } else {
          setError("An error occurred. Please try again.");
        }
      }
    };
    

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
  
    setIsLoading(true);
    setMessage("");
    setError("");
  
    try {
      const response = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
      setMessage(response.data.message);
  
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || "An error occurred. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="max-w-md w-full mx-4">
          <div className="backdrop-blur-lg bg-white/80 p-8 rounded-3xl shadow-xl border border-white/20">
            <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Invalid Reset Link
            </h1>
            <p className="text-red-500 text-center">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="backdrop-blur-lg bg-white/80 p-8 rounded-3xl shadow-xl border border-white/20">
          <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Reset Password
          </h1>
          {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-purple-600 group-hover:text-indigo-600 transition-colors duration-200" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
                         transition-all duration-200 ease-in-out
                         hover:bg-white/80"
                placeholder="New Password"
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-purple-600 group-hover:text-indigo-600 transition-colors duration-200" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
                         transition-all duration-200 ease-in-out
                         hover:bg-white/80"
                placeholder="Confirm New Password"
              />
            </div>
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
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage

