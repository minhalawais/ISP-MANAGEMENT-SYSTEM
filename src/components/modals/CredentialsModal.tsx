"use client"
import { Copy } from "lucide-react"

interface CredentialsModalProps {
  isVisible: boolean
  onClose: () => void
  credentials: {
    username: string
    password: string
    email: string
  }
}

export function CredentialsModal({ isVisible, onClose, credentials }: CredentialsModalProps) {
  if (!isVisible) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto backdrop-blur-sm bg-[#4A5568]/20">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-[#EBF5FF]">
          <h2 className="text-2xl font-bold mb-4 text-[#2A5C8A]">Employee Credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4A5568]">Username</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={credentials.username}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-[#EBF5FF] bg-[#F8FAFC] text-[#4A5568]"
                />
                <button
                  onClick={() => copyToClipboard(credentials.username)}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-[#EBF5FF] rounded-r-md bg-[#EBF5FF] text-[#3A86FF] hover:bg-[#3A86FF]/10 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4A5568]">Password</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={credentials.password}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-[#EBF5FF] bg-[#F8FAFC] text-[#4A5568]"
                />
                <button
                  onClick={() => copyToClipboard(credentials.password)}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-[#EBF5FF] rounded-r-md bg-[#EBF5FF] text-[#3A86FF] hover:bg-[#3A86FF]/10 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4A5568]">Email</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={credentials.email}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-[#EBF5FF] bg-[#F8FAFC] text-[#4A5568]"
                />
                <button
                  onClick={() => copyToClipboard(credentials.email)}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-[#EBF5FF] rounded-r-md bg-[#EBF5FF] text-[#3A86FF] hover:bg-[#3A86FF]/10 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#3A86FF] text-base font-medium text-white hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A86FF] transition-colors duration-200 sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
