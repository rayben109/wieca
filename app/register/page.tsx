"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: "mentor" | "mentee"
}

interface FormErrors {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: string
  general: string
}

export default function Register() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "mentee",
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    general: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentStep !== 3) {
      nextStep()
      return
    }

    setIsLoading(true)
    setFormErrors((prev) => ({ ...prev, general: "" }))

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      // Registration successful
      router.push("/login?registered=true")
    } catch (error) {
      console.error("Registration error:", error)
      setFormErrors((prev) => ({
        ...prev,
        general: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      }))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Image src="/logo.png" alt="WIECA Logo" width={100} height={100} className="h-20 w-auto" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        {formErrors.general && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{formErrors.general}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <div className={`h-2 w-1/3 ${currentStep >= 1 ? "bg-blue-500" : "bg-gray-200"} rounded-l-full`}></div>
          <div className={`h-2 w-1/3 ${currentStep >= 2 ? "bg-blue-500" : "bg-gray-200"}`}></div>
          <div className={`h-2 w-1/3 ${currentStep >= 3 ? "bg-blue-500" : "bg-gray-200"} rounded-r-full`}></div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    formErrors.name ? "border-red-300" : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="John Doe"
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? "name-error" : undefined}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600" id="name-error">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    formErrors.email ? "border-red-300" : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="john.doe@example.com"
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? "email-error" : undefined}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600" id="email-error">
                    {formErrors.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Security</h3>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      formErrors.password ? "border-red-300" : "border-gray-300"
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10`}
                    placeholder="••••••••"
                    aria-invalid={!!formErrors.password}
                    aria-describedby={formErrors.password ? "password-error" : "password-strength"}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                          clipRule="evenodd"
                        />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
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
                    <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1">
                      <li className={formData.password.length >= 8 ? "text-green-500" : ""}>At least 8 characters</li>
                      <li className={/[A-Z]/.test(formData.password) ? "text-green-500" : ""}>
                        At least one uppercase letter
                      </li>
                      <li className={/[a-z]/.test(formData.password) ? "text-green-500" : ""}>
                        At least one lowercase letter
                      </li>
                      <li className={/[0-9]/.test(formData.password) ? "text-green-500" : ""}>At least one number</li>
                      <li className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-500" : ""}>
                        At least one special character
                      </li>
                    </ul>
                  </div>
                )}

                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600" id="password-error">
                    {formErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    formErrors.confirmPassword ? "border-red-300" : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="••••••••"
                  aria-invalid={!!formErrors.confirmPassword}
                  aria-describedby={formErrors.confirmPassword ? "confirm-password-error" : undefined}
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600" id="confirm-password-error">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Role Selection</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I want to join as a:</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label
                    className={`relative border rounded-lg p-4 flex cursor-pointer focus:outline-none ${
                      formData.role === "mentor" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="mentor"
                      className="sr-only"
                      checked={formData.role === "mentor"}
                      onChange={handleChange}
                    />
                    <div className="flex items-center">
                      <div
                        className={`rounded-full h-5 w-5 flex items-center justify-center border ${
                          formData.role === "mentor" ? "border-blue-500" : "border-gray-300"
                        }`}
                      >
                        {formData.role === "mentor" && <div className="rounded-full bg-blue-500 w-3 h-3"></div>}
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Mentor</h4>
                        <p className="text-xs text-gray-500">I want to provide guidance and support</p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`relative border rounded-lg p-4 flex cursor-pointer focus:outline-none ${
                      formData.role === "mentee" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="mentee"
                      className="sr-only"
                      checked={formData.role === "mentee"}
                      onChange={handleChange}
                    />
                    <div className="flex items-center">
                      <div
                        className={`rounded-full h-5 w-5 flex items-center justify-center border ${
                          formData.role === "mentee" ? "border-blue-500" : "border-gray-300"
                        }`}
                      >
                        {formData.role === "mentee" && <div className="rounded-full bg-blue-500 w-3 h-3"></div>}
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Mentee</h4>
                        <p className="text-xs text-gray-500">I'm seeking guidance and support</p>
                      </div>
                    </div>
                  </label>
                </div>
                {formErrors.role && <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>}
              </div>

              <div className="text-sm text-gray-500 mt-4">
                <p>
                  By creating an account, you agree to our{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`${currentStep === 1 || currentStep === 2 ? "ml-auto" : "w-full"} flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
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
                  Creating account...
                </>
              ) : currentStep < 3 ? (
                "Continue"
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
