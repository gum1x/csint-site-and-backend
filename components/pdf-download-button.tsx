"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface PdfDownloadButtonProps {
  searchType: string
  searchQuery: string
  disabled?: boolean
}

export function PdfDownloadButton({ searchType, searchQuery, disabled = false }: PdfDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    if (!searchType || !searchQuery) {
      toast({
        title: "Missing information",
        description: "Search type and query are required to generate a PDF report.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: searchType,
          query: searchQuery,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate PDF")
      }

      // Check if the response is a PDF
      const contentType = response.headers.get("Content-Type")
      if (contentType === "application/pdf") {
        // Get the blob from the response
        const blob = await response.blob()

        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob)

        // Create a temporary link element
        const a = document.createElement("a")
        a.href = url
        a.download = `csint_report_${searchType}_${searchQuery}.pdf`

        // Append to the document, click it, and remove it
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        // Release the blob URL
        window.URL.revokeObjectURL(url)

        toast({
          title: "Success",
          description: "PDF report has been downloaded.",
        })
      } else {
        throw new Error("Unexpected response format")
      }
    } catch (error) {
      console.error("PDF download error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download PDF report",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || isLoading || !searchType || !searchQuery}
      variant="outline"
      size="sm"
      className="ml-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          PDF Report
        </>
      )}
    </Button>
  )
}
