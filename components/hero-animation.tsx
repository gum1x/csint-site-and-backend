"use client"

import { useEffect, useRef, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

export function HeroAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setIsReducedMotion(mediaQuery.matches)

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleReducedMotionChange)
    return () => mediaQuery.removeEventListener("change", handleReducedMotionChange)
  }, [])

  useEffect(() => {
    if (isReducedMotion) return // Skip animation for users who prefer reduced motion

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Particle class
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * (isMobile ? 4 : 5) + (isMobile ? 1 : 2)
        this.speedX = (Math.random() - 0.5) * (isMobile ? 0.4 : 0.6)
        this.speedY = (Math.random() - 0.5) * (isMobile ? 0.4 : 0.6)

        // More vibrant colors with emerald and cyan tones
        const hue =
          Math.random() > 0.5
            ? Math.floor(Math.random() * 40 + 140)
            : // Cyan range
              Math.floor(Math.random() * 40 + 160) // Emerald range

        const saturation = Math.floor(Math.random() * 30 + 70)
        const lightness = Math.floor(Math.random() * 20 + 60)

        this.color = `hsla(${hue}, ${saturation}%, ${lightness}%, ${Math.random() * 0.4 + 0.4})`
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvas.width) this.x = 0
        else if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        else if (this.y < 0) this.y = canvas.height
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Create particles - fewer on mobile for better performance
    const particlesArray: Particle[] = []
    const numberOfParticles = Math.min(
      isMobile ? 100 : 180,
      Math.floor((canvas.width * canvas.height) / (isMobile ? 12000 : 8000)),
    )

    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle())
    }

    // Connect particles with lines - shorter distance on mobile
    function connect() {
      if (!ctx) return
      const maxDistance = isMobile ? 150 : 200
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x
          const dy = particlesArray[a].y - particlesArray[b].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < maxDistance) {
            const opacity = 1 - distance / maxDistance
            // Create a gradient for the lines
            const gradient = ctx.createLinearGradient(
              particlesArray[a].x,
              particlesArray[a].y,
              particlesArray[b].x,
              particlesArray[b].y,
            )
            gradient.addColorStop(0, `rgba(16, 185, 129, ${opacity * 0.5})`)
            gradient.addColorStop(1, `rgba(6, 182, 212, ${opacity * 0.5})`)

            ctx.strokeStyle = gradient
            ctx.lineWidth = isMobile ? 1 : 1.5
            ctx.beginPath()
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y)
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y)
            ctx.stroke()
          }
        }
      }
    }

    // Animation loop with performance optimization
    let animationFrameId: number
    let lastTime = 0
    const fps = isMobile ? 30 : 60 // Lower FPS on mobile for better performance
    const fpsInterval = 1000 / fps

    function animate(timestamp: number) {
      animationFrameId = requestAnimationFrame(animate)

      const elapsed = timestamp - lastTime

      // Only render if enough time has passed
      if (elapsed > fpsInterval) {
        lastTime = timestamp - (elapsed % fpsInterval)

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (let i = 0; i < particlesArray.length; i++) {
          particlesArray[i].update()
          particlesArray[i].draw()
        }
        connect()
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isReducedMotion, isMobile])

  if (isReducedMotion) {
    // Render a static background for users who prefer reduced motion
    return <div className="h-full w-full bg-gradient-to-b from-gray-900 to-black opacity-30"></div>
  }

  return <canvas ref={canvasRef} className="h-full w-full" />
}
