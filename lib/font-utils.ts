// Font feature detection
export function supportsFontFeatures(): boolean {
  if (typeof document === "undefined") return false

  // Check if the browser supports font-feature-settings
  const style = document.createElement("style")
  style.textContent = '@supports (font-feature-settings: "kern") { body { --font-features-supported: 1; } }'
  document.head.appendChild(style)

  const supported = getComputedStyle(document.body).getPropertyValue("--font-features-supported") === "1"
  document.head.removeChild(style)

  return supported
}

// Font loading detection
export function detectFontLoading(fontFamily: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(false)
      return
    }

    // Use the Font Loading API if available
    if ("fonts" in document) {
      document.fonts.ready.then(() => {
        resolve(true)
      })
    } else {
      // Fallback for browsers without Font Loading API
      // This is less accurate but provides a fallback
      setTimeout(() => {
        resolve(true)
      }, 300)
    }
  })
}

// Get system font information
export function getSystemFontInfo(): { highDPI: boolean; os: string } {
  const highDPI = typeof window !== "undefined" && window.devicePixelRatio > 1

  let os = "unknown"
  if (typeof navigator !== "undefined") {
    const userAgent = navigator.userAgent
    if (userAgent.indexOf("Win") !== -1) os = "windows"
    else if (userAgent.indexOf("Mac") !== -1) os = "mac"
    else if (userAgent.indexOf("Linux") !== -1) os = "linux"
    else if (userAgent.indexOf("Android") !== -1) os = "android"
    else if (userAgent.indexOf("iOS") !== -1) os = "ios"
  }

  return { highDPI, os }
}
