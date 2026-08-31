"use client"

import type React from "react"
import { AlertCircle, Eye, EyeOff, IdCard, Lock, LogIn } from "lucide-react"
import { DomainLoginLogo } from "../DomainLoginLogo.tsx"

interface CustomerPortalAuthCardProps {
  mode: "login" | "set-password"
  cnic: string
  password: string
  showPassword: boolean
  newPassword: string
  confirmPassword: string
  showNewPassword: boolean
  loading: boolean
  error: string | null
  onCnicChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onToggleShowPassword: () => void
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onToggleShowNewPassword: () => void
  onSubmit: (e: React.FormEvent) => void
  onSignOut?: () => void
}

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 pl-10 pr-10 text-sm focus:border-portal-accent focus:outline-none focus:ring-2 focus:ring-portal-accent/40"

export function CustomerPortalAuthCard({
  mode,
  cnic,
  password,
  showPassword,
  newPassword,
  confirmPassword,
  showNewPassword,
  loading,
  error,
  onCnicChange,
  onPasswordChange,
  onToggleShowPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleShowNewPassword,
  onSubmit,
  onSignOut,
}: CustomerPortalAuthCardProps) {
  const isChangePassword = mode === "set-password"

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FA] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-portal-tint px-6 py-5 text-center">
            <div className="mx-auto mb-3 flex max-w-[180px] items-center justify-center">
              <DomainLoginLogo
                connectxClassName="mx-auto h-10 w-auto max-w-full object-contain"
                className="w-full"
              />
            </div>
            <h1 className="text-lg font-semibold text-deep-ocean">Customer portal</h1>
            <p className="mt-0.5 text-sm text-slate-gray">
              {isChangePassword ? "Set a new password to continue" : "Sign in with CNIC"}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 p-6">
            {!isChangePassword && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-gray">CNIC number</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={cnic}
                      onChange={(e) => onCnicChange(e.target.value)}
                      className={`${inputClass} font-mono tracking-wider`}
                      placeholder="0000000000000"
                      maxLength={13}
                    />
                  </div>
                  <p className="mt-1 text-right text-[11px] text-gray-400">{cnic.length}/13</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-gray">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      className={inputClass}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={onToggleShowPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {isChangePassword && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-gray">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => onNewPasswordChange(e.target.value)}
                      className={inputClass}
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={onToggleShowNewPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Toggle new password visibility"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-gray">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => onConfirmPasswordChange(e.target.value)}
                      className={`${inputClass} pr-3`}
                      placeholder="Re-enter new password"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">Use at least 8 characters.</p>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-coral-red/20 bg-coral-red/5 px-3 py-2 text-sm text-coral-red">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isChangePassword && cnic.length !== 13)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-portal-primary text-sm font-medium text-white hover:bg-portal-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {isChangePassword ? "Saving…" : "Signing in…"}
                </>
              ) : (
                <>
                  {isChangePassword ? <Lock className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  {isChangePassword ? "Save password" : "Sign in"}
                </>
              )}
            </button>

            {isChangePassword && onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="w-full py-2 text-sm text-slate-gray hover:text-gray-800"
              >
                Sign out
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
