import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import PDFDocument from "pdfkit"
import type PDFKit from "pdfkit" // Declare the PDFKit variable

// Helper function to fetch OSINT data based on type and query
async function fetchOsintData(type: string, query: string) {
  const OSINTDOG_KEY = process.env.OSINTDOG_KEY

  if (!OSINTDOG_KEY) {
    throw new Error("OSINTDOG_KEY is not defined")
  }

  let endpoint = ""

  switch (type) {
    case "email":
      endpoint = `https://api.osintdog.com/v1/email/${query}`
      break
    case "domain":
      endpoint = `https://api.osintdog.com/v1/domain/${query}`
      break
    case "ip":
      endpoint = `https://api.osintdog.com/v1/ip/${query}`
      break
    case "username":
      endpoint = `https://api.osintdog.com/v1/username/${query}`
      break
    case "phone":
      endpoint = `https://api.osintdog.com/v1/phone/${query}`
      break
    default:
      throw new Error(`Unsupported search type: ${type}`)
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${OSINTDOG_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return await response.json()
}

// Helper function to log search to database
async function logSearch(userId: string, type: string, query: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  await supabase.from("searches").insert({
    user_id: userId,
    search_type: type,
    search_query: query,
    created_at: new Date().toISOString(),
  })
}

// Helper function to increment search count
async function incrementSearchCount(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Check if user has a search count record for today
  const today = new Date().toISOString().split("T")[0]
  const { data: existingCount } = await supabase
    .from("search_count")
    .select("*")
    .eq("user_id", userId)
    .eq("search_date", today)
    .single()

  if (existingCount) {
    // Increment existing count
    await supabase
      .from("search_count")
      .update({ count: existingCount.count + 1 })
      .eq("id", existingCount.id)
  } else {
    // Create new count record
    await supabase.from("search_count").insert({
      user_id: userId,
      search_date: today,
      count: 1,
    })
  }
}

// Helper function to check if user has reached their search limit
async function checkSearchLimit(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Get user's plan
  const { data: user } = await supabase.from("users").select("plan").eq("id", userId).single()

  if (!user) {
    throw new Error("User not found")
  }

  // Get today's search count
  const today = new Date().toISOString().split("T")[0]
  const { data: searchCount } = await supabase
    .from("search_count")
    .select("count")
    .eq("user_id", userId)
    .eq("search_date", today)
    .single()

  const count = searchCount?.count || 0

  // Check against plan limits
  let limit = 5 // Default limit for basic plan

  if (user.plan === "standard") {
    limit = 20
  } else if (user.plan === "premium") {
    limit = 50
  } else if (user.plan === "enterprise") {
    limit = 100
  }

  return { count, limit, exceeded: count >= limit }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Parse request body
    const body = await request.json()
    const { type, query } = body

    if (!type || !query) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check search limit
    const { exceeded, count, limit } = await checkSearchLimit(userId)
    if (exceeded) {
      return NextResponse.json(
        {
          error: "Daily search limit reached",
          count,
          limit,
        },
        { status: 403 },
      )
    }

    // Fetch OSINT data
    const data = await fetchOsintData(type, query)

    // Log search and increment count
    await logSearch(userId, type, query)
    await incrementSearchCount(userId)

    // Generate PDF
    const pdfBuffer = await generatePDF(type, query, data)

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="csint_report_${type}_${query}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Define color scheme
const colors = {
  primary: "#6d28d9", // Purple
  secondary: "#4f46e5", // Indigo
  accent: "#8b5cf6", // Violet
  light: "#c4b5fd", // Light purple
  dark: "#4c1d95", // Dark purple
  text: "#1e293b", // Slate
  background: "#f8fafc", // Light background
  success: "#10b981", // Green
  warning: "#f59e0b", // Amber
  danger: "#ef4444", // Red
}

// Function to generate PDF
async function generatePDF(type: string, query: string, data: any) {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      // Create a new PDF document with custom options
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        info: {
          Title: `CSINT Network Intelligence Report - ${type.toUpperCase()} - ${query}`,
          Author: "CSINT Network",
          Subject: `OSINT Report for ${type}: ${query}`,
          Keywords: `osint, intelligence, ${type}, ${query}, csint network`,
          Creator: "CSINT Network PDF Generator",
          Producer: "CSINT Network",
        },
      })

      const chunks: Buffer[] = []

      doc.on("data", (chunk) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))
      doc.on("error", reject)

      // Add watermark to each page
      doc.on("pageAdded", () => {
        addWatermark(doc)
      })

      // Set background color for the entire page
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.background)

      // Add header with gradient background
      doc.rect(0, 0, doc.page.width, 120).fillColor(colors.primary).fill()

      // Add header text
      doc
        .fillColor("white")
        .fontSize(28)
        .font("Helvetica-Bold")
        .text("CSINT NETWORK", 50, 40, { align: "center" })
        .fontSize(18)
        .font("Helvetica")
        .text("Intelligence Report", 50, 75, { align: "center" })

      // Add watermark to first page
      addWatermark(doc)

      // Add report info box
      doc
        .roundedRect(50, 140, doc.page.width - 100, 100, 10)
        .fillColor(colors.light)
        .fill()

      doc.fillColor(colors.dark).fontSize(14).font("Helvetica-Bold").text("REPORT DETAILS", 70, 155)

      // Add report metadata with icons (simulated with characters)
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor(colors.text)
        .text(`🔍 Search Type: ${type.toUpperCase()}`, 70, 180)
        .text(`🔑 Query: ${query}`, 70, 200)
        .text(`🕒 Generated: ${new Date().toLocaleString()}`, 70, 220)

      // Add decorative line
      doc
        .moveTo(50, 260)
        .lineTo(doc.page.width - 50, 260)
        .strokeColor(colors.accent)
        .lineWidth(3)
        .stroke()

      // Start content section
      let yPosition = 280

      // Add content based on type with styled sections
      yPosition = addSectionHeader(doc, "Search Results", yPosition)

      // Format data based on type
      switch (type) {
        case "email":
          yPosition = formatEmailData(doc, data, yPosition)
          break
        case "domain":
          yPosition = formatDomainData(doc, data, yPosition)
          break
        case "ip":
          yPosition = formatIPData(doc, data, yPosition)
          break
        case "username":
          yPosition = formatUsernameData(doc, data, yPosition)
          break
        case "phone":
          yPosition = formatPhoneData(doc, data, yPosition)
          break
        default:
          doc.text("No specific formatting available for this search type.", 50, yPosition)
      }

      // Add disclaimer section
      yPosition = Math.min(yPosition + 30, doc.page.height - 150)
      yPosition = addSectionHeader(doc, "Disclaimer", yPosition)

      doc
        .font("Helvetica-Oblique")
        .fontSize(10)
        .fillColor(colors.text)
        .text(
          "This report contains information gathered from public sources. CSINT Network does not guarantee the accuracy or completeness of this information. This report should be used for informational purposes only.",
          50,
          yPosition,
          { width: doc.page.width - 100, align: "justify" },
        )

      // Add footer to each page
      const pageCount = doc.bufferedPageRange().count
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i)

        // Add footer background
        doc
          .rect(0, doc.page.height - 40, doc.page.width, 40)
          .fillColor(colors.primary)
          .fill()

        // Add footer text
        doc
          .fillColor("white")
          .fontSize(10)
          .font("Helvetica")
          .text("CSINT Network - Confidential Intelligence Report", 50, doc.page.height - 25, {
            align: "center",
          })

        // Add page number
        doc
          .fillColor("white")
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(`Page ${i + 1} of ${pageCount}`, doc.page.width - 100, doc.page.height - 25)
      }

      // Finalize the PDF
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// Helper function to add watermark
function addWatermark(doc: PDFKit.PDFDocument) {
  // Save the current state
  doc.save()

  // Set transparency
  doc.opacity(0.1)

  // Rotate the watermark
  doc.translate(doc.page.width / 2, doc.page.height / 2)
  doc.rotate(-45)

  // Draw the watermark text
  doc
    .fontSize(60)
    .font("Helvetica-Bold")
    .fillColor(colors.primary)
    .text("CSINT NETWORK", 0, 0, {
      align: "center",
      width: 600,
      origin: [300, 0],
    })

  // Restore the state
  doc.restore()
}

// Helper function to add a styled section header
function addSectionHeader(doc: PDFKit.PDFDocument, title: string, yPosition: number): number {
  // Check if we need a new page
  if (yPosition > doc.page.height - 150) {
    doc.addPage()
    yPosition = 50
  }

  // Add section header with background
  doc
    .roundedRect(50, yPosition, doc.page.width - 100, 30, 5)
    .fillColor(colors.secondary)
    .fill()

  doc
    .fillColor("white")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(title, 70, yPosition + 8)

  return yPosition + 40
}

// Helper function to add a subsection header
function addSubsectionHeader(doc: PDFKit.PDFDocument, title: string, yPosition: number): number {
  // Check if we need a new page
  if (yPosition > doc.page.height - 120) {
    doc.addPage()
    yPosition = 50
  }

  doc.fillColor(colors.primary).fontSize(12).font("Helvetica-Bold").text(title, 50, yPosition)

  // Add a small line under the subsection header
  doc
    .moveTo(50, yPosition + 20)
    .lineTo(200, yPosition + 20)
    .strokeColor(colors.light)
    .lineWidth(1)
    .stroke()

  return yPosition + 30
}

// Helper function to add a data field with label and value
function addDataField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string | number | boolean,
  yPosition: number,
): number {
  // Check if we need a new page
  if (yPosition > doc.page.height - 80) {
    doc.addPage()
    yPosition = 50
  }

  // Format boolean values
  if (typeof value === "boolean") {
    value = value ? "Yes" : "No"
  }

  // Add colored box for the field
  doc
    .roundedRect(50, yPosition, doc.page.width - 100, 25, 3)
    .fillColor(colors.background)
    .opacity(0.3)
    .fill()
    .opacity(1)
    .strokeColor(colors.light)
    .lineWidth(1)
    .stroke()

  // Add label
  doc
    .fillColor(colors.primary)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(label + ":", 60, yPosition + 7, { continued: true })

  // Add value
  doc
    .fillColor(colors.text)
    .fontSize(10)
    .font("Helvetica")
    .text(" " + value, { link: typeof value === "string" && value.startsWith("http") ? value : undefined })

  return yPosition + 30
}

// Helper functions to format different types of data
function formatEmailData(doc: PDFKit.PDFDocument, data: any, yPosition: number): number {
  yPosition = addSubsectionHeader(doc, "Email Information", yPosition)

  if (data.email) {
    yPosition = addDataField(doc, "Email", data.email, yPosition)
  }

  if (data.valid !== undefined) {
    yPosition = addDataField(doc, "Valid", data.valid, yPosition)
  }

  if (data.disposable !== undefined) {
    yPosition = addDataField(doc, "Disposable", data.disposable, yPosition)
  }

  if (data.domain) {
    yPosition = addSubsectionHeader(doc, "Domain Information", yPosition + 10)
    yPosition = addDataField(doc, "Domain", data.domain, yPosition)
  }

  if (data.breaches && data.breaches.length > 0) {
    yPosition = addSubsectionHeader(doc, "Breach Information", yPosition + 10)

    data.breaches.forEach((breach: any, index: number) => {
      // Add a colored box for each breach
      doc
        .roundedRect(50, yPosition, doc.page.width - 100, 80, 5)
        .fillColor(colors.light)
        .opacity(0.3)
        .fill()
        .opacity(1)

      doc
        .fillColor(colors.danger)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`Breach ${index + 1}: ${breach.name || "Unknown"}`, 60, yPosition + 10)

      if (breach.date) {
        doc
          .fillColor(colors.text)
          .fontSize(10)
          .font("Helvetica")
          .text(`Date: ${breach.date}`, 60, yPosition + 30)
      }

      if (breach.description) {
        doc
          .fillColor(colors.text)
          .fontSize(10)
          .font("Helvetica")
          .text(`Description: ${breach.description}`, 60, yPosition + 50, {
            width: doc.page.width - 120,
            ellipsis: true,
          })
      }

      yPosition += 90
    })
  }

  if (data.profiles && data.profiles.length > 0) {
    yPosition = addSubsectionHeader(doc, "Associated Profiles", yPosition + 10)

    data.profiles.forEach((profile: any) => {
      if (profile.site && profile.url) {
        yPosition = addDataField(doc, profile.site, profile.url, yPosition)
      }
    })
  }

  return yPosition
}

function formatDomainData(doc: PDFKit.PDFDocument, data: any, yPosition: number): number {
  yPosition = addSubsectionHeader(doc, "Domain Information", yPosition)

  if (data.domain) {
    yPosition = addDataField(doc, "Domain", data.domain, yPosition)
  }

  if (data.registrar) {
    yPosition = addDataField(doc, "Registrar", data.registrar, yPosition)
  }

  if (data.creation_date) {
    yPosition = addDataField(doc, "Creation Date", data.creation_date, yPosition)
  }

  if (data.expiration_date) {
    yPosition = addDataField(doc, "Expiration Date", data.expiration_date, yPosition)
  }

  if (data.nameservers && data.nameservers.length > 0) {
    yPosition = addSubsectionHeader(doc, "Nameservers", yPosition + 10)

    // Create a box for nameservers
    const boxHeight = data.nameservers.length * 20 + 20
    doc
      .roundedRect(50, yPosition, doc.page.width - 100, boxHeight, 5)
      .fillColor(colors.light)
      .opacity(0.3)
      .fill()
      .opacity(1)

    let nsYPosition = yPosition + 10
    data.nameservers.forEach((ns: string) => {
      doc.fillColor(colors.text).fontSize(10).font("Helvetica").text(`• ${ns}`, 70, nsYPosition)
      nsYPosition += 20
    })

    yPosition += boxHeight + 10
  }

  if (data.ip_addresses && data.ip_addresses.length > 0) {
    yPosition = addSubsectionHeader(doc, "IP Addresses", yPosition + 10)

    // Create a box for IP addresses
    const boxHeight = data.ip_addresses.length * 20 + 20
    doc
      .roundedRect(50, yPosition, doc.page.width - 100, boxHeight, 5)
      .fillColor(colors.light)
      .opacity(0.3)
      .fill()
      .opacity(1)

    let ipYPosition = yPosition + 10
    data.ip_addresses.forEach((ip: string) => {
      doc.fillColor(colors.text).fontSize(10).font("Helvetica").text(`• ${ip}`, 70, ipYPosition)
      ipYPosition += 20
    })

    yPosition += boxHeight + 10
  }

  if (data.whois) {
    yPosition = addSubsectionHeader(doc, "WHOIS Information", yPosition + 10)

    // Create a box for WHOIS info
    doc
      .roundedRect(50, yPosition, doc.page.width - 100, 200, 5)
      .fillColor(colors.light)
      .opacity(0.3)
      .fill()
      .opacity(1)

    doc
      .fillColor(colors.text)
      .fontSize(9)
      .font("Courier")
      .text(data.whois, 60, yPosition + 10, {
        width: doc.page.width - 120,
        height: 180,
        ellipsis: true,
      })

    yPosition += 220
  }

  return yPosition
}

function formatIPData(doc: PDFKit.PDFDocument, data: any, yPosition: number): number {
  yPosition = addSubsectionHeader(doc, "IP Information", yPosition)

  if (data.ip) {
    yPosition = addDataField(doc, "IP", data.ip, yPosition)
  }

  if (data.type) {
    yPosition = addDataField(doc, "Type", data.type, yPosition)
  }

  if (data.location) {
    yPosition = addSubsectionHeader(doc, "Location Information", yPosition + 10)

    // Create a box for location info
    doc
      .roundedRect(50, yPosition, doc.page.width - 100, 120, 5)
      .fillColor(colors.light)
      .opacity(0.3)
      .fill()
      .opacity(1)

    let locYPosition = yPosition + 10
    if (data.location.country) {
      doc
        .fillColor(colors.text)
        .fontSize(10)
        .font("Helvetica")
        .text(`Country: ${data.location.country}`, 70, locYPosition)
      locYPosition += 20
    }
    if (data.location.region) {
      doc
        .fillColor(colors.text)
        .fontSize(10)
        .font("Helvetica")
        .text(`Region: ${data.location.region}`, 70, locYPosition)
      locYPosition += 20
    }
    if (data.location.city) {
      doc.fillColor(colors.text).fontSize(10).font("Helvetica").text(`City: ${data.location.city}`, 70, locYPosition)
      locYPosition += 20
    }
    if (data.location.latitude) {
      doc
        .fillColor(colors.text)
        .fontSize(10)
        .font("Helvetica")
        .text(`Latitude: ${data.location.latitude}`, 70, locYPosition)
      locYPosition += 20
    }
    if (data.location.longitude) {
      doc
        .fillColor(colors.text)
        .fontSize(10)
        .font("Helvetica")
        .text(`Longitude: ${data.location.longitude}`, 70, locYPosition)
    }

    yPosition += 130
  }

  if (data.isp) {
    yPosition = addSubsectionHeader(doc, "ISP Information", yPosition + 10)
    yPosition = addDataField(doc, "ISP", data.isp, yPosition)
  }

  if (data.asn) {
    yPosition = addDataField(doc, "ASN", data.asn, yPosition)
  }

  if (data.security) {
    yPosition = addSubsectionHeader(doc, "Security Information", yPosition + 10)

    // Create a box for security info with color coding based on risk
    const hasSecurity = data.security.tor || data.security.proxy || data.security.vpn
    const boxColor = hasSecurity ? colors.warning : colors.success

    doc
      .roundedRect(50, yPosition, doc.page.width - 100, 90, 5)
      .fillColor(boxColor)
      .opacity(0.3)
      .fill()
      .opacity(1)

    let secYPosition = yPosition + 10
    if (data.security.tor !== undefined) {
      doc
        .fillColor(data.security.tor ? colors.danger : colors.success)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`Tor Exit Node: ${data.security.tor ? "Yes" : "No"}`, 70, secYPosition)
      secYPosition += 20
    }
    if (data.security.proxy !== undefined) {
      doc
        .fillColor(data.security.proxy ? colors.warning : colors.success)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`Proxy: ${data.security.proxy ? "Yes" : "No"}`, 70, secYPosition)
      secYPosition += 20
    }
    if (data.security.vpn !== undefined) {
      doc
        .fillColor(data.security.vpn ? colors.warning : colors.success)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`VPN: ${data.security.vpn ? "Yes" : "No"}`, 70, secYPosition)
    }

    yPosition += 100
  }

  return yPosition
}

function formatUsernameData(doc: PDFKit.PDFDocument, data: any, yPosition: number): number {
  yPosition = addSubsectionHeader(doc, "Username Information", yPosition)

  if (data.username) {
    yPosition = addDataField(doc, "Username", data.username, yPosition)
  }

  if (data.profiles && data.profiles.length > 0) {
    yPosition = addSubsectionHeader(doc, "Associated Profiles", yPosition + 10)

    data.profiles.forEach((profile: any, index: number) => {
      if (profile.site) {
        // Alternate background colors for better readability
        const bgColor = index % 2 === 0 ? colors.light : colors.background

        // Create a box for each profile
        doc
          .roundedRect(50, yPosition, doc.page.width - 100, 70, 5)
          .fillColor(bgColor)
          .opacity(0.3)
          .fill()
          .opacity(1)

        doc
          .fillColor(colors.primary)
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(`${profile.site}`, 60, yPosition + 10)

        if (profile.url) {
          doc
            .fillColor(colors.secondary)
            .fontSize(10)
            .font("Helvetica")
            .text(`URL: ${profile.url}`, 60, yPosition + 30, {
              link: profile.url,
              underline: true,
            })
        }

        if (profile.status) {
          const statusColor = profile.status === "found" ? colors.success : colors.danger
          doc
            .fillColor(statusColor)
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(`Status: ${profile.status}`, 60, yPosition + 50)
        }

        yPosition += 80
      }
    })
  }

  return yPosition
}

function formatPhoneData(doc: PDFKit.PDFDocument, data: any, yPosition: number): number {
  yPosition = addSubsectionHeader(doc, "Phone Information", yPosition)

  if (data.phone) {
    yPosition = addDataField(doc, "Phone", data.phone, yPosition)
  }

  if (data.valid !== undefined) {
    const validColor = data.valid ? colors.success : colors.danger
    doc
      .roundedRect(50, yPosition, doc.page.width - 100, 25, 3)
      .fillColor(validColor)
      .opacity(0.2)
      .fill()
      .opacity(1)
      .strokeColor(validColor)
      .lineWidth(1)
      .stroke()

    doc
      .fillColor(validColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`Valid: ${data.valid ? "Yes" : "No"}`, 60, yPosition + 7)

    yPosition += 30
  }

  if (data.type) {
    yPosition = addDataField(doc, "Type", data.type, yPosition)
  }

  if (data.carrier) {
    yPosition = addDataField(doc, "Carrier", data.carrier, yPosition)
  }

  if (data.location) {
    yPosition = addSubsectionHeader(doc, "Location Information", yPosition + 10)

    // Create a box for location info
    doc
      .roundedRect(50, yPosition, doc.page.width - 100, 80, 5)
      .fillColor(colors.light)
      .opacity(0.3)
      .fill()
      .opacity(1)

    let locYPosition = yPosition + 10
    if (data.location.country) {
      doc
        .fillColor(colors.text)
        .fontSize(10)
        .font("Helvetica")
        .text(`Country: ${data.location.country}`, 70, locYPosition)
      locYPosition += 20
    }
    if (data.location.region) {
      doc
        .fillColor(colors.text)
        .fontSize(10)
        .font("Helvetica")
        .text(`Region: ${data.location.region}`, 70, locYPosition)
      locYPosition += 20
    }
    if (data.location.city) {
      doc.fillColor(colors.text).fontSize(10).font("Helvetica").text(`City: ${data.location.city}`, 70, locYPosition)
    }

    yPosition += 90
  }

  return yPosition
}
