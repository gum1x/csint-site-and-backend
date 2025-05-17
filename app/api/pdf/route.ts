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

// Function to generate PDF
async function generatePDF(type: string, query: string, data: any) {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []

      doc.on("data", (chunk) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))
      doc.on("error", reject)

      // Add header
      doc.fontSize(25).font("Helvetica-Bold").text("CSINT Network Intelligence Report", { align: "center" })

      doc.moveDown()

      // Add report metadata
      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`Report Type: ${type.toUpperCase()}`, { continued: false })
        .text(`Query: ${query}`, { continued: false })
        .text(`Generated: ${new Date().toLocaleString()}`, { continued: false })

      doc.moveDown()

      // Add horizontal line
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke()

      doc.moveDown()

      // Add content based on type
      doc.fontSize(16).font("Helvetica-Bold").text("Search Results", { underline: true })

      doc.moveDown()

      // Format data based on type
      switch (type) {
        case "email":
          formatEmailData(doc, data)
          break
        case "domain":
          formatDomainData(doc, data)
          break
        case "ip":
          formatIPData(doc, data)
          break
        case "username":
          formatUsernameData(doc, data)
          break
        case "phone":
          formatPhoneData(doc, data)
          break
        default:
          doc.text("No specific formatting available for this search type.")
      }

      // Add footer
      const pageCount = doc.bufferedPageRange().count
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i)

        // Save position
        const originalY = doc.y

        // Go to bottom of page
        doc
          .fontSize(10)
          .font("Helvetica")
          .text("CSINT Network - Confidential Intelligence Report", 50, doc.page.height - 50, { align: "center" })

        // Add page number
        doc.text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 30, { align: "center" })

        // Restore position
        doc.y = originalY
      }

      // Finalize the PDF
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// Helper functions to format different types of data
function formatEmailData(doc: PDFKit.PDFDocument, data: any) {
  doc.fontSize(14).font("Helvetica-Bold").text("Email Information")
  doc.fontSize(12).font("Helvetica")

  if (data.email) {
    doc.text(`Email: ${data.email}`)
  }

  if (data.valid !== undefined) {
    doc.text(`Valid: ${data.valid ? "Yes" : "No"}`)
  }

  if (data.disposable !== undefined) {
    doc.text(`Disposable: ${data.disposable ? "Yes" : "No"}`)
  }

  if (data.domain) {
    doc.moveDown()
    doc.fontSize(14).font("Helvetica-Bold").text("Domain Information")
    doc.fontSize(12).font("Helvetica")
    doc.text(`Domain: ${data.domain}`)
  }

  if (data.breaches && data.breaches.length > 0) {
    doc.moveDown()
    doc.fontSize(14).font("Helvetica-Bold").text("Breach Information")
    doc.fontSize(12).font("Helvetica")

    data.breaches.forEach((breach: any, index: number) => {
      doc.text(`Breach ${index + 1}: ${breach.name || "Unknown"}`)
      if (breach.date) doc.text(`Date: ${breach.date}`)
      if (breach.description) doc.text(`Description: ${breach.description}`)
      doc.moveDown(0.5)
    })
  }

  if (data.profiles && data.profiles.length > 0) {
    doc.moveDown()
    doc.fontSize(14).font("Helvetica-Bold").text("Associated Profiles")
    doc.fontSize(12).font("Helvetica")

    data.profiles.forEach((profile: any) => {
      if (profile.site && profile.url) {
        doc.text(`${profile.site}: ${profile.url}`)
      }
    })
  }
}

function formatDomainData(doc: PDFKit.PDFDocument, data: any) {
  doc.fontSize(14).font("Helvetica-Bold").text("Domain Information")
  doc.fontSize(12).font("Helvetica")

  if (data.domain) {
    doc.text(`Domain: ${data.domain}`)
  }

  if (data.registrar) {
    doc.text(`Registrar: ${data.registrar}`)
  }

  if (data.creation_date) {
    doc.text(`Creation Date: ${data.creation_date}`)
  }

  if (data.expiration_date) {
    doc.text(`Expiration Date: ${data.expiration_date}`)
  }

  if (data.nameservers && data.nameservers.length > 0) {
    doc.moveDown()
    doc.fontSize(14).font("Helvetica-Bold").text("Nameservers")
    doc.fontSize(12).font("Helvetica")

    data.nameservers.forEach((ns: string) => {
      doc.text(`- ${ns}`)
    })
  }

  if (data.ip_addresses && data.ip_addresses.length > 0) {
    doc.moveDown()
    doc.fontSize(14).font("Helvetica-Bold").text("IP Addresses")
    doc.fontSize(12).font("Helvetica")

    data.ip_addresses.forEach((ip: string) => {
      doc.text(`- ${ip}`)
    })
  }

  if (data.whois) {
    doc.moveDown()
    doc.fontSize(14).font("Helvetica-Bold").text("WHOIS Information")
    doc.fontSize(12).font("Helvetica")
    doc.text(data.whois)
  }
}

function formatIPData(doc: PDFKit.PDFDocument, data: any) {
  doc.fontSize(14).font("Helvetica-Bold").text("IP Information")
  doc.fontSize(12).font("Helvetica")

  if (data.ip) {
    doc.text(`IP: ${data.ip}`)
  }

  if (data.type) {
    doc.text(`Type: ${data.type}`)
  }

  if (data.location) {
    doc.moveDown()
    doc.fontSize(14).font("Helvetica-Bold").text("Location Information")
    doc.fontSize(12).font("Helvetica")

    if (data.location.country) doc.text(`Country: ${data.location.country}`)
    if (data.location.region) doc.text(`Region: ${data.location.region}`)
    if (data.location.city) doc.text(`City: ${data.location.city}`)
    if (data.location.latitude) doc.text(`Latitude: ${data.location.latitude}`)
    if (data.location.longitude) doc.text(`Longitude: ${data.location.longitude}`)
  }

  if (data.isp) {
    doc.moveDown()
    doc.fontSize(14).font("Helvetica-Bold").text("ISP Information")
    doc.fontSize(12).font("Helvetica")
    doc.text(`ISP: ${data.isp}`)
  }

  if (data.asn) {
    doc.text(`ASN: ${data.asn}`)
  }

  if (data.security) {
    doc.moveDown()
    doc.fontSize(14).font("Helvetica-Bold").text("Security Information")
    doc.fontSize(12).font("Helvetica")

    if (data.security.tor) doc.text(`Tor Exit Node: ${data.security.tor ? "Yes" : "No"}`)
    if (data.security.proxy) doc.text(`Proxy: ${data.security.proxy ? "Yes" : "No"}`)
    if (data.security.vpn) doc.text(`VPN: ${data.security.vpn ? "Yes" : "No"}`)
  }
}

function formatUsernameData(doc: PDFKit.PDFDocument, data: any) {
  doc.fontSize(14).font("Helvetica-Bold").text("Username Information")
  doc.fontSize(12).font("Helvetica")

  if (data.username) {
    doc.text(`Username: ${data.username}`)
  }

  if (data.profiles && data.profiles.length > 0) {
    doc.moveDown()
    doc.fontSize(14).font("Helvetica-Bold").text("Associated Profiles")
    doc.fontSize(12).font("Helvetica")

    data.profiles.forEach((profile: any) => {
      if (profile.site) {
        doc.text(`Site: ${profile.site}`)
        if (profile.url) doc.text(`URL: ${profile.url}`)
        if (profile.status) doc.text(`Status: ${profile.status}`)
        doc.moveDown(0.5)
      }
    })
  }
}

function formatPhoneData(doc: PDFKit.PDFDocument, data: any) {
  doc.fontSize(14).font("Helvetica-Bold").text("Phone Information")
  doc.fontSize(12).font("Helvetica")

  if (data.phone) {
    doc.text(`Phone: ${data.phone}`)
  }

  if (data.valid !== undefined) {
    doc.text(`Valid: ${data.valid ? "Yes" : "No"}`)
  }

  if (data.type) {
    doc.text(`Type: ${data.type}`)
  }

  if (data.carrier) {
    doc.text(`Carrier: ${data.carrier}`)
  }

  if (data.location) {
    doc.moveDown()
    doc.fontSize(14).font("Helvetica-Bold").text("Location Information")
    doc.fontSize(12).font("Helvetica")

    if (data.location.country) doc.text(`Country: ${data.location.country}`)
    if (data.location.region) doc.text(`Region: ${data.location.region}`)
    if (data.location.city) doc.text(`City: ${data.location.city}`)
  }
}
