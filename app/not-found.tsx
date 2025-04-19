import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] py-12 text-center">
      <h1 className="text-6xl font-bold text-[#DB7C27] mb-4">404</h1>
      <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-gray-500 max-w-md mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <Link href="/">
        <Button className="bg-[#DB7C27] hover:bg-[#c06a1f]">Return to Home</Button>
      </Link>
    </div>
  )
}
