"use client"

import { useEffect, useState } from "react"
import { detectFontLoading, supportsFontFeatures, getSystemFontInfo } from "@/lib/font-utils"

export function FontOptimizer() {
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [fontFeaturesSupported, setFontFeaturesSupported] = useState(false)
  const [systemInfo, setSystemInfo] = useState<{ highDPI: boolean; os: string } | null>(null)

  useEffect(() => {
    // Check font features support
    const featuresSupported = supportsFontFeatures()
    setFontFeaturesSupported(featuresSupported)

    // Get system information
    const sysInfo = getSystemFontInfo()
    setSystemInfo(sysInfo)

    // Detect when fonts are loaded
    detectFontLoading("Inter").then(() => {
      setFontsLoaded(true)
      document.documentElement.classList.add("fonts-loaded")
    })
  }, [])

  // Apply OS-specific font optimizations
  useEffect(() => {
    if (!systemInfo) return

    const { highDPI, os } = systemInfo

    // Apply OS-specific font rendering optimizations
    if (os === "mac" || os === "ios") {
      document.documentElement.classList.add("font-mac")
    } else if (os === "windows") {
      document.documentElement.classList.add("font-windows")
    } else if (os === "android") {
      document.documentElement.classList.add("font-android")
    }

    // Apply high DPI optimizations
    if (highDPI) {
      document.documentElement.classList.add("high-dpi")
    }
  }, [systemInfo])

  return null
}
