import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-orange-50 dark:from-gray-950 dark:to-gray-900">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  WIECA Mentor Connect Programme
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Connect with industry professionals in renewable energy and
                  build meaningful mentorship relationships.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/register">
                  <Button className="bg-[#DB7C27] hover:bg-[#c06a1f]">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-[4/3] rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="/mentorship.png"
                  alt="Mentorship in renewable energy"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Areas of Impact Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Areas of Impact
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Our mentorship program creates meaningful impact across various
                renewable energy sectors
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
            {/* Impact Area 1 */}
            <div className="group relative overflow-hidden rounded-lg border bg-background p-6 shadow-md transition-all hover:shadow-lg">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-[#DB7C27]/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#DB7C27]"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Solar Energy</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Connecting mentees with experts in photovoltaic technology,
                solar thermal systems, and solar project development.
              </p>
              <Link
                href="/search"
                className="text-[#DB7C27] font-medium inline-flex items-center group-hover:underline"
              >
                Learn more <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Impact Area 2 */}
            <div className="group relative overflow-hidden rounded-lg border bg-background p-6 shadow-md transition-all hover:shadow-lg">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-[#DB7C27]/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#DB7C27]"
                >
                  <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Wind Energy</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Supporting career growth in wind farm development, turbine
                technology, and offshore wind innovations.
              </p>
              <Link
                href="/search"
                className="text-[#DB7C27] font-medium inline-flex items-center group-hover:underline"
              >
                Learn more <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Impact Area 3 */}
            <div className="group relative overflow-hidden rounded-lg border bg-background p-6 shadow-md transition-all hover:shadow-lg">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-[#DB7C27]/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#DB7C27]"
                >
                  <path d="M2 12h20M2 12a10 10 0 0 1 20 0M2 12a10 10 0 0 0 20 0M4 12a8 8 0 0 1 16 0M4 12a8 8 0 0 0 16 0M6 12a6 6 0 0 1 12 0M6 12a6 6 0 0 0 12 0M8 12a4 4 0 0 1 8 0M8 12a4 4 0 0 0 8 0M10 12a2 2 0 0 1 4 0M10 12a2 2 0 0 0 4 0" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Energy Storage</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Facilitating knowledge exchange in battery technology,
                grid-scale storage, and energy management systems.
              </p>
              <Link
                href="/search"
                className="text-[#DB7C27] font-medium inline-flex items-center group-hover:underline"
              >
                Learn more <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Impact Area 4 */}
            <div className="group relative overflow-hidden rounded-lg border bg-background p-6 shadow-md transition-all hover:shadow-lg">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-[#DB7C27]/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#DB7C27]"
                >
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Hydroelectric Power</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Mentoring in hydropower project development, environmental
                impact assessment, and sustainable water management.
              </p>
              <Link
                href="/search"
                className="text-[#DB7C27] font-medium inline-flex items-center group-hover:underline"
              >
                Learn more <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Impact Area 5 */}
            <div className="group relative overflow-hidden rounded-lg border bg-background p-6 shadow-md transition-all hover:shadow-lg">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-[#DB7C27]/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#DB7C27]"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Energy Policy</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Guiding professionals in renewable energy policy development,
                regulatory frameworks, and government relations.
              </p>
              <Link
                href="/search"
                className="text-[#DB7C27] font-medium inline-flex items-center group-hover:underline"
              >
                Learn more <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Impact Area 6 */}
            <div className="group relative overflow-hidden rounded-lg border bg-background p-6 shadow-md transition-all hover:shadow-lg">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-[#DB7C27]/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#DB7C27]"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="12" y1="16" x2="12" y2="16" />
                  <line x1="12" y1="8" x2="12" y2="8" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Green Finance</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Connecting mentees with experts in sustainable investing,
                project financing, and carbon markets.
              </p>
              <Link
                href="/search"
                className="text-[#DB7C27] font-medium inline-flex items-center group-hover:underline"
              >
                Learn more <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                How It Works
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Our platform makes it easy to find the perfect mentor or share
                your expertise as a mentor.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DB7C27] text-white">
                1
              </div>
              <h3 className="text-xl font-bold">Create Your Profile</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Sign up and build your detailed profile showcasing your
                experience, interests, and goals.
              </p>
              <div className="relative h-40 w-full rounded-lg overflow-hidden shadow-md">
                <Image
                  src="/profile-creation.png"
                  alt="Creating a profile"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DB7C27] text-white">
                2
              </div>
              <h3 className="text-xl font-bold">Find Your Match</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Browse through potential mentors or receive AI-powered
                recommendations based on your profile.
              </p>
              <div className="relative h-40 w-full rounded-lg overflow-hidden shadow-md">
                <Image
                  src="/mentor-matching.png"
                  alt="Finding a mentor match"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DB7C27] text-white">
                3
              </div>
              <h3 className="text-xl font-bold">Connect & Grow</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Send mentorship requests and start building valuable
                professional relationships.
              </p>
              <div className="relative h-40 w-full rounded-lg overflow-hidden shadow-md">
                <Image
                  src="/mentorship-meeting.png"
                  alt="Mentorship meeting"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Success Stories
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Hear from professionals who have benefited from our mentorship
                programme.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4 rounded-lg border p-6 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-full">
                  <Image
                    src="/testimonial-1.jpg"
                    alt="Sarah Johnson"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Sarah Johnson</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Solar Project Manager
                  </p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                "The WIECA Mentor Connect Programme connected me with an
                industry leader who helped me navigate my career transition into
                renewable energy. The guidance I received was invaluable."
              </p>
            </div>
            <div className="flex flex-col justify-center space-y-4 rounded-lg border p-6 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-full">
                  <Image
                    src="/testimonial-2.jpg"
                    alt="Michael Chen"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Michael Chen</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Wind Energy Consultant
                  </p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                "As a mentor, I've found the platform incredibly rewarding. It's
                well-organized and makes it easy to connect with passionate
                individuals looking to grow in the renewable energy sector."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-[#DB7C27]">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center text-white">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Connect?
              </h2>
              <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join our community of renewable energy professionals today.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/register">
                <Button className="bg-white text-[#DB7C27] hover:bg-gray-100">
                  Register Now
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="text-[#DB7C27] border-white hover:bg-white/10 hover:text-white"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gray-100 dark:bg-gray-900 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="relative h-10 w-40">
                <Image
                  src="/logo.png"
                  alt="WIECA Mentor Connect"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Connecting professionals in the renewable energy sector to
                foster growth, innovation, and knowledge sharing.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-500 hover:text-[#DB7C27]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <span className="sr-only">Facebook</span>
                </Link>
                <Link href="#" className="text-gray-500 hover:text-[#DB7C27]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link href="#" className="text-gray-500 hover:text-[#DB7C27]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-gray-500 hover:text-[#DB7C27] dark:text-gray-400"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/search"
                    className="text-gray-500 hover:text-[#DB7C27] dark:text-gray-400"
                  >
                    Find Mentors
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="text-gray-500 hover:text-[#DB7C27] dark:text-gray-400"
                  >
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/messages"
                    className="text-gray-500 hover:text-[#DB7C27] dark:text-gray-400"
                  >
                    Messages
                  </Link>
                </li>
                <li>
                  <Link
                    href="/calendar"
                    className="text-gray-500 hover:text-[#DB7C27] dark:text-gray-400"
                  >
                    Calendar
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="#"
                    className="text-gray-500 hover:text-[#DB7C27] dark:text-gray-400"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-500 hover:text-[#DB7C27] dark:text-gray-400"
                  >
                    Mentorship Guide
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-500 hover:text-[#DB7C27] dark:text-gray-400"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-500 hover:text-[#DB7C27] dark:text-gray-400"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-500 hover:text-[#DB7C27] dark:text-gray-400"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Contact Us</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-[#DB7C27] mt-0.5" />
                  <span className="text-gray-500 dark:text-gray-400">
                    Dar es Salaam, Tanzania
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-[#DB7C27]" />
                  <span className="text-gray-500 dark:text-gray-400">
                    +255 (0) 734 150 500
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-[#DB7C27]" />
                  <span className="text-gray-500 dark:text-gray-400">
                    info@wiecaglobal.com
                  </span>
                </li>
              </ul>
              <form className="space-y-2">
                <label htmlFor="email-footer" className="sr-only">
                  Email
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    id="email-footer"
                    placeholder="Your email"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    className="bg-[#DB7C27] hover:bg-[#c06a1f]"
                  >
                    Subscribe
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Subscribe to our newsletter for updates
                </p>
              </form>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              © {new Date().getFullYear()} WIECA Mentor Connect. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
