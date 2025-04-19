import { type NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/actions/auth-actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role } = body

    if (!email || !password || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const result = await registerUser({ email, password, role })

    if (result.success) {
      return NextResponse.json({ success: true, userId: result.userId })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Registration API error:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
  }
}
