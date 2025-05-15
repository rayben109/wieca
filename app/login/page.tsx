"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Eye, EyeOff, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/profile"
  const error = searchParams.get("error")
  const registered = searchParams.get("registered") === "true"

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    general: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Real-time validation
  useEffect(() => {
    if (formData.email) validateEmail(formData.email)
  }, [formData.email])

  useEffect(() => {
    if (formData.password) validatePassword(formData.password)
  }, [formData.password])

  // Handle error messages from URL
  useEffect(() => {
    if (error) {
      const errorMessages: Record<string, string> = {
        CredentialsSignin: "Invalid email or password. Please try again.",
        SessionRequired: "Please sign in to access this page.",
        AccessDenied: "You do not have permission to access this page.",
        Default: "An error occurred. Please try again.",
      }

      setFormErrors((prev) => ({
        ...prev,
        general: errorMessages[error] || errorMessages.Default,
      }))
    }

    if (registered) {
      toast({
        title: "Registration successful",
        description: "Your account has been created. Please sign in.",
        variant: "default",
      })
    }
  }, [error, registered])

  const validateEmail = (value: string) => {
    if (!value) {
      setFormErrors((prev) => ({ ...prev, email: "Email is required" }))
      return false
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setFormErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }))
      return false
    } else {
      setFormErrors((prev) => ({ ...prev, email: "" }))
      return true
    }
  }

  const validatePassword = (value: string) => {
    if (!value) {
      setFormErrors((prev) => ({ ...prev, password: "Password is required" }))
      return false
    } else {
      setFormErrors((prev) => ({ ...prev, password: "" }))
      return true
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields before submission
    const isEmailValid = validateEmail(formData.email)
    const isPasswordValid = validatePassword(formData.password)

    if (!isEmailValid || !isPasswordValid) {
      return
    }

    setIsLoading(true)
    setFormErrors((prev) => ({ ...prev, general: "" }))

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      })

      if (result?.error) {
        setFormErrors((prev) => ({ ...prev, general: "Invalid email or password. Please try again." }))
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login successful",
          description: "Welcome back to WIECA Mentor Connect!",
        })
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      console.error("Login error:", error)
      setFormErrors((prev) => ({ ...prev, general: "An unexpected error occurred. Please try again." }))
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
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
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Enter your credentials to sign in to your account</p>
        </div>

        <Card>
          {formErrors.general && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 mx-6 mt-6 rounded">
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={formData.email}
                  onChange={handleChange}
                  className={formErrors.email ? "border-red-300" : ""}
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? "email-error" : undefined}
                  required
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500" id="email-error">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link href="/forgot-password" className="text-sm font-medium text-[#DB7C27] hover:text-[#c06a1f]">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`pr-10 ${formErrors.password ? "border-red-300" : ""}`}
                    aria-invalid={!!formErrors.password}
                    aria-describedby={formErrors.password ? "password-error" : undefined}
                    required
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
                {formErrors.password && (
                  <p className="text-sm text-red-500" id="password-error">
                    {formErrors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#DB7C27] hover:bg-[#c06a1f]"
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
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="mt-2 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[#DB7C27] hover:text-[#c06a1f] font-medium">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
