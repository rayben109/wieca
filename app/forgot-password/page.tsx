"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { requestPasswordReset } from "@/lib/actions/auth-actions"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

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
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
            <CardDescription className="text-center">
              {isSubmitted
                ? "Check your email for a reset link"
                : "Enter your email address and we'll send you a link to reset your password"}
            </CardDescription>
          </CardHeader>
          {!isSubmitted ? (
            <CardContent>
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
                  />
                </div>
                <Button className="w-full bg-[#DB7C27] hover:bg-[#c06a1f]" type="submit" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </CardContent>
          ) : (
            <CardContent className="text-center py-6">
              <p className="mb-4">
                We've sent an email to <strong>{email}</strong> with instructions to reset your password.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't see it in your inbox, please check your spam folder.
              </p>
            </CardContent>
          )}
          <CardFooter className="flex justify-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
