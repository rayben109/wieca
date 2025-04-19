import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"

// Validate critical environment variables
function validateAuthConfig() {
  const missingVars = []

  if (!process.env.NEXTAUTH_URL) missingVars.push("NEXTAUTH_URL")
  if (!process.env.NEXTAUTH_SECRET) missingVars.push("NEXTAUTH_SECRET")

  if (missingVars.length > 0) {
    console.error(`Critical environment variables missing: ${missingVars.join(", ")}`)
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Authentication configuration error: Missing ${missingVars.join(", ")}`)
    }
  }

  // Validate NEXTAUTH_URL format
  if (process.env.NEXTAUTH_URL) {
    try {
      new URL(process.env.NEXTAUTH_URL)
    } catch (e) {
      console.error("NEXTAUTH_URL is not a valid URL")
      if (process.env.NODE_ENV === "production") {
        throw new Error("Authentication configuration error: NEXTAUTH_URL is not a valid URL")
      }
    }
  }
}

// Run validation
validateAuthConfig()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Validate database connection before attempting to query
          const db = await connectToDatabase()
          const user = await db.collection("users").findOne({ email: credentials.email })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || null,
            role: user.role || "user",
          }
        } catch (error) {
          console.error("Authorization error:", error)
          // Rethrow with more context for better debugging
          throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error(`[Auth Error] ${code}:`, metadata)
    },
    warn(code) {
      console.warn(`[Auth Warning] ${code}`)
    },
  },
}
