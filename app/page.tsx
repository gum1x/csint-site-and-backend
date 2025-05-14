"use client"

import Link from "next/link"
import { ArrowRight, Database, Lock, Search, Shield, Terminal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HeroAnimation } from "@/components/hero-animation"
import { FeatureCard } from "@/components/feature-card"
import { ToolsList } from "@/components/tools-list"
import { Navbar } from "@/components/navbar"
import { CtaSection } from "@/components/cta-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 lg:py-36">
        <div className="absolute inset-0 z-0 opacity-40">
          <HeroAnimation />
        </div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h1 className="mb-4 md:mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent animate-gradient-flow">
                Csint Network
              </span>
            </h1>
            <p className="mx-auto mb-8 md:mb-10 max-w-2xl text-base md:text-lg text-gray-400">
              Your premier source for CSINT tools, databases, and intelligence resources
            </p>
          </div>
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Button
              size="lg"
              className="group w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 transition-all-300 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40"
              onClick={() => document.getElementById("tools-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Tools
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-all-300 backdrop-blur-sm"
            >
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent inline-block">
              Advanced CSINT Capabilities
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-cyan-600 mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Database className="h-8 w-8 md:h-10 md:w-10 text-emerald-400" />}
              title="Extensive Databases"
              description="Access to over 200+ billion records from various data sources and breaches."
            />
            <FeatureCard
              icon={<Search className="h-8 w-8 md:h-10 md:w-10 text-cyan-400" />}
              title="Powerful Search"
              description="Advanced search capabilities across multiple intelligence sources."
            />
            <FeatureCard
              icon={<Terminal className="h-8 w-8 md:h-10 md:w-10 text-blue-400" />}
              title="CSINT Tools"
              description="Free and premium tools for comprehensive cyber intelligence gathering."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 md:h-10 md:w-10 text-purple-400" />}
              title="Security First"
              description="Secure access to sensitive information with proper authentication."
            />
            <FeatureCard
              icon={<Lock className="h-8 w-8 md:h-10 md:w-10 text-pink-400" />}
              title="Private API Access"
              description="Integrate our data with your security tools via our secure API."
            />
            <FeatureCard
              icon={<Terminal className="h-8 w-8 md:h-10 md:w-10 text-yellow-400" />}
              title="Telegram Bot"
              description="Access our tools directly through our 24/7 Telegram bot service."
            />
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-gray-900 to-gray-950" id="tools-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent inline-block">
              Our CSINT Providers
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-cyan-600 mx-auto mt-4 rounded-full"></div>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Access to the world's largest collection of intelligence databases
            </p>
          </div>
          <ToolsList />
          <div className="mt-10 text-center">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 transition-all-300 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40"
            >
              View All Providers
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <CtaSection />
    </div>
  )
}
