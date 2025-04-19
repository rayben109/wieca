"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn, signOut } from "next-auth/react"

export default function AuthTestPage() {
  const { data: session, status } = useSession()

  return (
    <div className="container py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">Status: {status}</p>
            {session && (
              <pre className="bg-muted p-2 rounded text-xs mt-2 overflow-auto">{JSON.stringify(session, null, 2)}</pre>
            )}
          </div>

          <div className="flex gap-2">
            {!session ? (
              <Button onClick={() => signIn()} className="bg-[#DB7C27] hover:bg-[#c06a1f]">
                Sign In
              </Button>
            ) : (
              <Button onClick={() => signOut()} variant="outline">
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
