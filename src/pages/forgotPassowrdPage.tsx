import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail } from "lucide-react"
import axiosInstance from "../utils/axiosConfig.ts"

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");
  
    try {
      const response = await axiosInstance.post("/auth/forgot-password", { email });
      setMessage(response.data.message);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="backdrop-blur-lg bg-white/80 p-8 rounded-3xl shadow-xl border border-white/20">
          <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Forgot Password
          </h1>
          {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-purple-600 group-hover:text-indigo-600 transition-colors duration-200" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
                         transition-all duration-200 ease-in-out
                         hover:bg-white/80"
                placeholder="Enter your email"
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
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage

