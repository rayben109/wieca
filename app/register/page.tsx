"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { registerUser } from "@/lib/actions/auth-actions"
import { toast } from "@/components/ui/use-toast"
import { signIn } from "next-auth/react"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userRole, setUserRole] = useState("mentee")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const { email, password, confirmPassword } = formData
    const role = userRole

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const result = await registerUser({ email, password, role })

      if (result.success) {
        toast({
          title: "Registration successful",
          description: "Please sign in to complete your profile.",
        })

        // Auto sign in after registration
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (signInResult?.error) {
          console.error("Auto sign-in failed:", signInResult.error)
          router.push("/login")
        } else {
          router.push("/profile")
        }
      } else {
        toast({
          title: "Registration failed",
          description: result.error || "An error occurred during registration.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
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
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create an account</CardTitle>
            <CardDescription className="text-center">Enter your email below to create your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>I want to join as a:</Label>
                <RadioGroup
                  defaultValue="mentee"
                  name="role"
                  className="flex flex-col space-y-1"
                  value={userRole}
                  onValueChange={setUserRole}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mentee" id="mentee" />
                    <Label htmlFor="mentee" className="font-normal">
                      Mentee - I'm seeking guidance
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mentor" id="mentor" />
                    <Label htmlFor="mentor" className="font-normal">
                      Mentor - I want to share my expertise
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <Button className="w-full bg-[#DB7C27] hover:bg-[#c06a1f]" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="text-sm text-center text-gray-500 mt-2">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </Link>
              .
            </div>
          </CardFooter>
        </Card>
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
