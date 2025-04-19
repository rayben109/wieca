import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Export the handler as both GET and POST
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
