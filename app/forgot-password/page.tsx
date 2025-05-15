"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { requestPasswordReset } from "@/lib/actions/auth-actions"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [generalError, setGeneralError] = useState("")

  // Real-time validation
  useEffect(() => {
    if (email) validateEmail(email)
  }, [email])

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email is required")
      return false
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError("Please enter a valid email address")
      return false
    } else {
      setEmailError("")
      return true
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateEmail(email)) {
      return
    }

    setIsLoading(true)
    setGeneralError("")

    try {
      const result = await requestPasswordReset(email)

      if (result.success) {
        setIsSubmitted(true)
        toast({
          title: "Reset link sent",
          description: "If an account exists with this email, you will receive a password reset link.",
        })
      } else {
        // We don't want to reveal if an email exists or not for security reasons
        // So we show the same success message even if there's an error
        setIsSubmitted(true)
        toast({
          title: "Reset link sent",
          description: "If an account exists with this email, you will receive a password reset link.",
        })
        console.error("Password reset error:", result.error)
      }
    } catch (error) {
      console.error("Password reset error:", error)
      // Same message for security
      setIsSubmitted(true)
      toast({
        title: "Reset link sent",
        description: "If an account exists with this email, you will receive a password reset link.",
      })
    } finally {
      setIsLoading(false)
    }
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
            {isSubmitted
              ? "Check your email for a reset link"
              : "Enter your email address and we'll send you a link to reset your password"}
          </p>
        </div>

        <Card>
          {generalError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-6 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{generalError}</p>
                </div>
              </div>
            </div>
          )}

          <CardContent className="pt-6">
            {!isSubmitted ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    className={emailError ? "border-red-300" : ""}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                  />
                  {emailError && (
                    <p className="text-sm text-red-500" id="email-error">
                      {emailError}
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
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
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
                <div>
                  <p className="mb-2">
                    We've sent an email to <strong>{email}</strong> with instructions to reset your password.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If you don't see it in your inbox, please check your spam folder.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 border-[#DB7C27] text-[#DB7C27] hover:bg-[#DB7C27]/10"
                  onClick={() => router.push("/login")}
                >
                  Return to login
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
