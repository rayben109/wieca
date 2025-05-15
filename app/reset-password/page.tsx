"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { resetPassword, verifyResetToken } from "@/lib/actions/auth-actions"
import { AlertCircle, CheckCircle, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({
    password: "",
    confirmPassword: "",
    general: "",
  })
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Too weak",
    color: "bg-red-500",
  })

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setIsVerifying(false)
        return
      }

      try {
        const result = await verifyResetToken(token)
        setIsTokenValid(result.valid)
      } catch (error) {
        console.error("Token verification error:", error)
        setIsTokenValid(false)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  // Real-time validation
  useEffect(() => {
    if (password) {
      validatePassword(password)
      checkPasswordStrength(password)
    }
  }, [password])

  useEffect(() => {
    if (confirmPassword) validateConfirmPassword(confirmPassword)
  }, [confirmPassword, password])

  const validatePassword = (value: string) => {
    if (!value) {
      setFormErrors((prev) => ({ ...prev, password: "Password is required" }))
      return false
    } else if (value.length < 8) {
      setFormErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters" }))
      return false
    } else {
      setFormErrors((prev) => ({ ...prev, password: "" }))
      return true
    }
  }

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setFormErrors((prev) => ({ ...prev, confirmPassword: "Please confirm your password" }))
      return false
    } else if (value !== password) {
      setFormErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
      return false
    } else {
      setFormErrors((prev) => ({ ...prev, confirmPassword: "" }))
      return true
    }
  }

  const checkPasswordStrength = (password: string) => {
    // Check password strength
    let score = 0

    // Length check
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1

    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1 // Has uppercase
    if (/[a-z]/.test(password)) score += 1 // Has lowercase
    if (/[0-9]/.test(password)) score += 1 // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1 // Has special char

    // Normalize score to 0-4 range
    score = Math.min(4, Math.floor(score / 1.5))

    const strengthLabels = ["Too weak", "Weak", "Fair", "Good", "Strong"]
    const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"]

    setPasswordStrength({
      score,
      label: strengthLabels[score],
      color: strengthColors[score],
    })
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Validate all fields before submission
    const isPasswordValid = validatePassword(password)
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword)

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return
    }

    if (!token) {
      setFormErrors((prev) => ({ ...prev, general: "Missing reset token." }))
      return
    }

    setIsLoading(true)
    setFormErrors((prev) => ({ ...prev, general: "" }))

    try {
      const result = await resetPassword(token, password)

      if (result.success) {
        setIsSubmitted(true)
        toast({
          title: "Password reset successful",
          description: "Your password has been reset. You can now log in with your new password.",
        })
      } else {
        setFormErrors((prev) => ({
          ...prev,
          general: result.error || "An error occurred during password reset.",
        }))
        toast({
          title: "Password reset failed",
          description: result.error || "An error occurred during password reset.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Password reset error:", error)
      setFormErrors((prev) => ({
        ...prev,
        general: "An unexpected error occurred. Please try again.",
      }))
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center mb-6">
              <Image src="/logo.png" alt="WIECA Logo" width={150} height={50} priority className="h-12 w-auto" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Verifying reset link</h1>
            <p className="text-sm text-muted-foreground">Please wait while we verify your reset link...</p>
          </div>

          <Card>
            <CardContent className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DB7C27]"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!token || !isTokenValid) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center mb-6">
              <Image src="/logo.png" alt="WIECA Logo" width={150} height={50} priority className="h-12 w-auto" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Invalid or expired link</h1>
            <p className="text-sm text-muted-foreground">This password reset link is invalid or has expired.</p>
          </div>

          <Card>
            <CardContent className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <p>Please request a new password reset link.</p>
              <Button className="mt-4 bg-[#DB7C27] hover:bg-[#c06a1f]" onClick={() => router.push("/forgot-password")}>
                Request new link
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-[#DB7C27]">
                Back to login
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="WIECA Logo" width={150} height={50} priority className="h-12 w-auto" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-sm text-muted-foreground">
            {isSubmitted ? "Your password has been reset" : "Enter your new password below"}
          </p>
        </div>

        <Card>
          {formErrors.general && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-6 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{formErrors.general}</p>
                </div>
              </div>
            </div>
          )}

          <CardContent className="pt-6">
            {!isSubmitted ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={`pr-10 ${formErrors.password ? "border-red-300" : ""}`}
                      aria-invalid={!!formErrors.password}
                      aria-describedby={formErrors.password ? "password-error" : "password-strength"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {password && (
                    <div className="mt-2" id="password-strength">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">{passwordStrength.label}</span>
                      </div>
                      <ul className="text-xs text-gray-500 space-y-1 mt-2">
                        <li className="flex items-center">
                          {password.length >= 8 ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-300 mr-1" />
                          )}
                          At least 8 characters
                        </li>
                        <li className="flex items-center">
                          {/[A-Z]/.test(password) ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-300 mr-1" />
                          )}
                          At least one uppercase letter
                        </li>
                        <li className="flex items-center">
                          {/[a-z]/.test(password) ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-300 mr-1" />
                          )}
                          At least one lowercase letter
                        </li>
                        <li className="flex items-center">
                          {/[0-9]/.test(password) ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-300 mr-1" />
                          )}
                          At least one number
                        </li>
                        <li className="flex items-center">
                          {/[^A-Za-z0-9]/.test(password) ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-300 mr-1" />
                          )}
                          At least one special character
                        </li>
                      </ul>
                    </div>
                  )}

                  {formErrors.password && (
                    <p className="text-sm text-red-500" id="password-error">
                      {formErrors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={formErrors.confirmPassword ? "border-red-300" : ""}
                    aria-invalid={!!formErrors.confirmPassword}
                    aria-describedby={formErrors.confirmPassword ? "confirm-password-error" : undefined}
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-sm text-red-500" id="confirm-password-error">
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  className="w-full bg-[#DB7C27] hover:bg-[#c06a1f]"
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="mb-2">Your password has been successfully reset.</p>
                <Button className="mt-4 bg-[#DB7C27] hover:bg-[#c06a1f]" onClick={() => router.push("/login")}>
                  Go to login
                </Button>
              </div>
            )}
          </CardContent>
          {!isSubmitted && (
            <CardFooter className="flex justify-center border-t pt-4">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-[#DB7C27]">
                Back to login
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
