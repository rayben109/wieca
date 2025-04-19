"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { resetPassword, verifyResetToken } from "@/lib/actions/auth-actions"

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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      })
      return
    }

    if (!token) {
      toast({
        title: "Invalid request",
        description: "Missing reset token.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPassword(token, password)

      if (result.success) {
        setIsSubmitted(true)
        toast({
          title: "Password reset successful",
          description: "Your password has been reset. You can now log in with your new password.",
        })
      } else {
        toast({
          title: "Password reset failed",
          description: result.error || "An error occurred during password reset.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Password reset error:", error)
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Verifying reset link</CardTitle>
            <CardDescription className="text-center">Please wait while we verify your reset link...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DB7C27]"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!token || !isTokenValid) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Invalid or expired link</CardTitle>
            <CardDescription className="text-center">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <p>Please request a new password reset link.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/forgot-password">
              <Button className="bg-[#DB7C27] hover:bg-[#c06a1f]">Request new link</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
            <CardDescription className="text-center">
              {isSubmitted ? "Your password has been reset" : "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          {!isSubmitted ? (
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button className="w-full bg-[#DB7C27] hover:bg-[#c06a1f]" type="submit" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </CardContent>
          ) : (
            <CardContent className="text-center py-6">
              <p className="mb-4">Your password has been successfully reset.</p>
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
