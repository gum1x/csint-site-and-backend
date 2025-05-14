"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Terminal } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  return (
    <header
      className={`sticky top-0 z-50 border-b border-gray-800 backdrop-blur-md transition-all duration-300 ${
        isScrolled ? "bg-black/90 shadow-lg shadow-black/30" : "bg-black/70"
      } glass-effect`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 transition-all duration-300 hover:text-emerald-400">
          <Terminal className="h-6 w-6 text-emerald-400" />
          <span className="text-xl font-bold">Csint Network</span>
        </Link>

        {/* Navigation links removed */}

        <div className="hidden items-center md:flex">
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-all-300 hover:border-emerald-600"
          >
            <Link href="/login">Login</Link>
          </Button>
        </div>

        <button
          className="block md:hidden transition-transform duration-300 hover:text-emerald-400"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
        </button>
      </div>

      {/* Mobile menu with improved transition */}
      <div
        className={`fixed inset-0 top-16 z-40 bg-black/95 backdrop-blur-md transform transition-transform duration-500 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="container mx-auto flex flex-col gap-4 p-4">
          {/* Mobile navigation links removed */}

          <div className="mt-4 flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-all-300 hover:border-emerald-600"
            >
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                Login
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
