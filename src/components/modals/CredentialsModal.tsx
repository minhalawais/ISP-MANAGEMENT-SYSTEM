import React from "react"
import { FaCopy } from "react-icons/fa"

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
    <div className="fixed z-50 inset-0 overflow-y-auto backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-[#89A8B2]">Employee Credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={credentials.username}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 bg-gray-50 text-gray-500"
                />
                <button
                  onClick={() => copyToClipboard(credentials.username)}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                >
                  <FaCopy />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={credentials.password}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 bg-gray-50 text-gray-500"
                />
                <button
                  onClick={() => copyToClipboard(credentials.password)}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                >
                  <FaCopy />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={credentials.email}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 bg-gray-50 text-gray-500"
                />
                <button
                  onClick={() => copyToClipboard(credentials.email)}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                >
                  <FaCopy />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#89A8B2] text-base font-medium text-white hover:bg-[#7B97A1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#89A8B2] sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

