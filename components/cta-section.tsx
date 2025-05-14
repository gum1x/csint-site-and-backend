"use client"

import { useState, useEffect } from "react"
import { Shield, Lock, Database } from "lucide-react"

export function CtaSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: <Shield className="h-6 w-6 text-emerald-400" />,
      title: "Advanced Security",
      description: "Military-grade encryption and secure access protocols",
    },
    {
      icon: <Database className="h-6 w-6 text-cyan-400" />,
      title: "Massive Databases",
      description: "Access to over 200+ billion records from various sources",
    },
    {
      icon: <Lock className="h-6 w-6 text-blue-400" />,
      title: "Private Access",
      description: "Exclusive tools available only to members",
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    const element = document.getElementById("cta-section")
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [features.length])

  return (
    <section id="cta-section" className="py-24 md:py-32 bg-black relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                width: `${Math.random() * 400 + 50}px`,
                height: `${Math.random() * 400 + 50}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                background: `radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(6,182,212,0.15) 70%, rgba(0,0,0,0) 100%)`,
                transform: `scale(${Math.random() * 0.5 + 0.5})`,
                animation: `float ${Math.random() * 15 + 20}s linear infinite`,
                animationDelay: `${Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div
          className={`max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] transition-all duration-1000 animate-glow ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-2">
            <div className="bg-gradient-to-r from-gray-900 to-black rounded-xl p-8 md:p-12 border border-gray-800 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
                <div className="flex-1 space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent animate-gradient-flow">
                    Ready to enhance your intelligence capabilities?
                  </h2>

                  <div className="h-24 md:h-20">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 transition-all duration-700 absolute ${
                          activeFeature === index ? "opacity-100 transform-none" : "opacity-0 translate-y-4"
                        }`}
                        style={{ display: activeFeature === index ? "flex" : "none" }}
                      >
                        <div className="mt-1 p-2 rounded-full bg-gray-800/50 backdrop-blur-sm shadow-inner">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white">{feature.title}</h3>
                          <p className="text-gray-400">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-gray-400 text-lg">
                    Csint Network provides access to premium tools and databases for cyber security intelligence.
                  </p>
                </div>

                <div className="w-full md:w-auto flex flex-col items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-900/50 px-4 py-2 rounded-full backdrop-blur-sm">
                    <Lock className="h-4 w-4" />
                    <span>Secure, encrypted access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
