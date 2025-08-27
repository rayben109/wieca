"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, LogOut, MessageSquare, Users } from "lucide-react"
import { NotificationsPopover } from "@/components/notifications"

export default function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (path: string) => pathname === path
  const isMentor = session?.user?.role === "mentor"
  const isAdmin = session?.user?.role === "admin"

  const navigation = [
    { name: "Home", href: "/" },
    //admin specific links
    ...(status === "authenticated" && isAdmin
    ? [{ name: "Admin Panel", href: "/admin", icon: Users }]
    : 
    //mentor and mentee specific links
    status === "authenticated"
      ? [
          { name: "Profile", href: "/profile" },
          { name: "Messages", href: "/messages", icon: MessageSquare },
          {
            name: isMentor  ? "My Mentees" : "My Mentors",
            href: isMentor  ? "/mentees" : "/mentors",
            icon: Users,
          },
          {
            name: isMentor  ? "Requests" : "Find Mentors",
            href: isMentor  ? "/requests" : "/search",
          },
          
        ]
      : []),
  ]

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!session?.user?.name) return "U"
    return session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-32 sm:w-40">
              <Image src="/logo.png" alt="WIECA Mentor Connect" fill className="object-contain" priority />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex mx-6 items-center space-x-4 lg:space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-[#DB7C27] ${
                isActive(item.href) ? "text-[#DB7C27]" : "text-muted-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {status === "authenticated" && <NotificationsPopover />}

          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.profileImage || "/placeholder.svg"} alt={session.user.name || ""} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name || session.user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/messages">Messages</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={isMentor ? "/mentees" : "/mentors"}>{isMentor ? "My Mentees" : "My Mentors"}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={isMentor ? "/requests" : "/search"}>
                    {isMentor ? "Mentorship Requests" : "Find Mentors"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex gap-2">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#DB7C27] hover:bg-[#c06a1f]">Sign Up</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex justify-center mb-6 mt-4">
                <div className="relative h-8 w-40">
                  <Image src="/logo.png" alt="WIECA Mentor Connect" fill className="object-contain" />
                </div>
              </div>
              <nav className="flex flex-col gap-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-[#DB7C27] ${
                      isActive(item.href) ? "text-[#DB7C27]" : "text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.name}
                    </div>
                  </Link>
                ))}
                {status === "unauthenticated" && (
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-[#DB7C27] hover:bg-[#c06a1f]">Sign Up</Button>
                    </Link>
                  </>
                )}
                {status === "authenticated" && (
                  <Button
                    variant="ghost"
                    className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                    onClick={() => {
                      setIsOpen(false)
                      signOut({ callbackUrl: "/" })
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
