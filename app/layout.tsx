import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { generateSecurityScript } from "@/lib/security"
import { FontOptimizer } from "@/components/font-optimizer"

// Optimize font loading with proper configuration
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  variable: "--font-inter",
  preload: true,
  adjustFontFallback: true, // Optimize font metrics
})

export const metadata: Metadata = {
  title: "Csint Network - Cyber Security Intelligence Tools",
  description: "Your premier source for CSINT tools, databases, and intelligence resources",
  keywords: "CSINT, cyber security, intelligence, data breach, security tools",
  authors: [{ name: "Csint Network" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: "Csint Network - Cyber Security Intelligence Tools",
    description: "Your premier source for CSINT tools, databases, and intelligence resources",
    siteName: "Csint Network",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Generate the security script
  const securityScript = generateSecurityScript()

  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`}>
      <head>
        {/* Preconnect to Google Fonts to improve loading performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Add font-display CSS to prevent layout shifts */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: local('Inter Regular'), local('Inter-Regular');
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 500;
            font-display: swap;
            src: local('Inter Medium'), local('Inter-Medium');
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 600;
            font-display: swap;
            src: local('Inter SemiBold'), local('Inter-SemiBold');
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: local('Inter Bold'), local('Inter-Bold');
          }
          
          /* Font smoothing */
          html {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          
          /* OS-specific optimizations */
          .font-mac {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          .font-windows {
            -webkit-font-smoothing: subpixel-antialiased;
          }
          
          /* High DPI screens */
          .high-dpi {
            font-synthesis: none;
          }
          
          /* Prevent layout shifts when fonts load */
          html:not(.fonts-loaded) * {
            letter-spacing: -0.005em;
          }
        `,
          }}
        />

        {/* Security meta tags */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none';"
        />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), interest-cohort=()" />

        {/* Anti-debugging script */}
        <script dangerouslySetInnerHTML={{ __html: securityScript }} />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <FontOptimizer />
        {children}
      </body>
    </html>
  )
}
