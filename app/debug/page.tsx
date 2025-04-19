import { AuthDebug } from "@/components/auth-debug"

export default function DebugPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
      <AuthDebug />
    </div>
  )
}
