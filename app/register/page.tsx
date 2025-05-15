"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { signIn } from "next-auth/react"
import { registerUser } from "@/lib/actions/auth-actions"
import { AlertCircle, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "mentee" as "mentee" | "mentor",
  })
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    general: "",
  })
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Too weak",
    color: "bg-red-500",
  })

  // Real-time validation
  useEffect(() => {
    if (formData.name) validateName(formData.name)
  }, [formData.name])

  useEffect(() => {
    if (formData.email) validateEmail(formData.email)
  }, [formData.email])

  useEffect(() => {
    if (formData.password) {
      validatePassword(formData.password)
      checkPasswordStrength(formData.password)
    }
  }, [formData.password])

  useEffect(() => {
    if (formData.confirmPassword) validateConfirmPassword(formData.confirmPassword)
  }, [formData.confirmPassword, formData.password])

  const validateName = (value: string) => {
    if (!value.trim()) {
      setFormErrors((prev) => ({ ...prev, name: "Name is required" }))
      return false
    } else if (value.trim().length < 2) {
      setFormErrors((prev) => ({ ...prev, name: "Name must be at least 2 characters" }))
      return false
    } else {
      setFormErrors((prev) => ({ ...prev, name: "" }))
      return true
    }
  }

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
    } else if (value !== formData.password) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateStep1 = () => {
    const isNameValid = validateName(formData.name)
    const isEmailValid = validateEmail(formData.email)

    return isNameValid && isEmailValid
  }

  const validateStep2 = () => {
    const isPasswordValid = validatePassword(formData.password)
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword)

    return isPasswordValid && isConfirmPasswordValid
  }

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (currentStep !== 3) {
      nextStep()
      return
    }

    setIsLoading(true)
    setFormErrors((prev) => ({ ...prev, general: "" }))

    try {
      const result = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })

      if (result.success) {
        toast({
          title: "Registration successful",
          description: "Please sign in to complete your profile.",
        })

        // Auto sign in after registration
        const signInResult = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (signInResult?.error) {
          console.error("Auto sign-in failed:", signInResult.error)
          router.push("/login?registered=true")
        } else {
          router.push("/profile")
        }
      } else {
        toast({
          title: "Registration failed",
          description: result.error || "An error occurred during registration.",
          variant: "destructive",
        })
        setFormErrors((prev) => ({ ...prev, general: result.error || "Registration failed" }))
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setFormErrors((prev) => ({ ...prev, general: "An unexpected error occurred. Please try again." }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="WIECA Logo" width={150} height={50} priority className="h-12 w-auto" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            {currentStep === 1
              ? "Enter your information to create an account"
              : currentStep === 2
                ? "Create a secure password"
                : "Choose your role"}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center mb-2">
              <div className={`h-2 w-1/3 ${currentStep >= 1 ? "bg-[#DB7C27]" : "bg-gray-200"} rounded-l-full`}></div>
              <div className={`h-2 w-1/3 ${currentStep >= 2 ? "bg-[#DB7C27]" : "bg-gray-200"}`}></div>
              <div className={`h-2 w-1/3 ${currentStep >= 3 ? "bg-[#DB7C27]" : "bg-gray-200"} rounded-r-full`}></div>
            </div>
            <CardTitle className="text-lg">
              Step {currentStep} of 3:{" "}
              {currentStep === 1 ? "Personal Info" : currentStep === 2 ? "Security" : "Role Selection"}
            </CardTitle>
          </CardHeader>

          {formErrors.general && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 rounded">
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

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className={formErrors.name ? "border-red-300" : ""}
                      aria-invalid={!!formErrors.name}
                      aria-describedby={formErrors.name ? "name-error" : undefined}
                      required
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500" id="name-error">
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      autoCapitalize="none"
                      autoComplete="email"
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
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`pr-10 ${formErrors.password ? "border-red-300" : ""}`}
                        aria-invalid={!!formErrors.password}
                        aria-describedby={formErrors.password ? "password-error" : "password-strength"}
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

                    {formData.password && (
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
                            {formData.password.length >= 8 ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 text-gray-300 mr-1" />
                            )}
                            At least 8 characters
                          </li>
                          <li className="flex items-center">
                            {/[A-Z]/.test(formData.password) ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 text-gray-300 mr-1" />
                            )}
                            At least one uppercase letter
                          </li>
                          <li className="flex items-center">
                            {/[a-z]/.test(formData.password) ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 text-gray-300 mr-1" />
                            )}
                            At least one lowercase letter
                          </li>
                          <li className="flex items-center">
                            {/[0-9]/.test(formData.password) ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 text-gray-300 mr-1" />
                            )}
                            At least one number
                          </li>
                          <li className="flex items-center">
                            {/[^A-Za-z0-9]/.test(formData.password) ? (
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
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={formErrors.confirmPassword ? "border-red-300" : ""}
                      aria-invalid={!!formErrors.confirmPassword}
                      aria-describedby={formErrors.confirmPassword ? "confirm-password-error" : undefined}
                      required
                    />
                    {formErrors.confirmPassword && (
                      <p className="text-sm text-red-500" id="confirm-password-error">
                        {formErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>I want to join as a:</Label>
                    <RadioGroup
                      defaultValue="mentee"
                      name="role"
                      className="flex flex-col space-y-1"
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, role: value as "mentee" | "mentor" }))
                      }
                    >
                      <div className="flex items-center space-x-2 rounded-md border p-3 shadow-sm hover:border-[#DB7C27] transition-colors">
                        <RadioGroupItem value="mentee" id="mentee" />
                        <Label htmlFor="mentee" className="flex flex-col">
                          <span className="font-medium">Mentee</span>
                          <span className="text-xs text-muted-foreground">I'm seeking guidance and support</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-md border p-3 shadow-sm hover:border-[#DB7C27] transition-colors">
                        <RadioGroupItem value="mentor" id="mentor" />
                        <Label htmlFor="mentor" className="flex flex-col">
                          <span className="font-medium">Mentor</span>
                          <span className="text-xs text-muted-foreground">I want to provide guidance and support</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="text-xs text-muted-foreground mt-4">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="text-[#DB7C27] hover:text-[#c06a1f] underline underline-offset-4">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-[#DB7C27] hover:text-[#c06a1f] underline underline-offset-4">
                      Privacy Policy
                    </Link>
                    .
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="border-[#DB7C27] text-[#DB7C27] hover:bg-[#DB7C27]/10"
                  >
                    Back
                  </Button>
                ) : (
                  <div></div>
                )}

                <Button
                  type="submit"
                  className={`${currentStep === 3 ? "w-full" : ""} bg-[#DB7C27] hover:bg-[#c06a1f] text-white`}
                  disabled={isLoading}
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
                      Creating account...
                    </>
                  ) : currentStep < 3 ? (
                    "Continue"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-[#DB7C27] hover:text-[#c06a1f] font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
