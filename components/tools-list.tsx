"use client"

import { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const tools = [
  { name: "OathNet", records: "30 Billion" },
  { name: "Hackcheck", records: "15,864,137,330" },
  { name: "Leakcheck", records: "28 Billion" },
  { name: "Intelvault", records: "10,937,191,611" },
  { name: "Snusbase", records: "16.7 Billion" },
  { name: "Osintdog", records: "Unknown" },
  { name: "Osintcat", records: "Premium Access" },
  { name: "Seon", records: "15 Billion" },
  { name: "Snusbase Beta", records: "20+ Billion" },
]

export function ToolsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const isMobile = useIsMobile()
  const itemsPerPage = isMobile ? 6 : 12

  const filteredTools = tools.filter((tool) => tool.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const totalPages = Math.ceil(filteredTools.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTools = filteredTools.slice(indexOfFirstItem, indexOfLastItem)

  // Reset to first page when screen size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [isMobile])

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    // Smooth scroll to top of list on mobile
    if (isMobile) {
      const toolsSection = document.getElementById("tools-section")
      if (toolsSection) {
        toolsSection.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  // Calculate visible page numbers for pagination
  const getVisiblePageNumbers = () => {
    const delta = isMobile ? 1 : 2
    const range = []

    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i)
    }

    return range
  }

  return (
    <div id="tools-section" className="mx-auto max-w-5xl">
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          type="search"
          placeholder="Search providers..."
          className="border-gray-700 bg-gray-800 pl-10 text-white placeholder:text-gray-500 focus:border-emerald-500"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1) // Reset to first page on search
          }}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {currentTools.map((tool, index) => (
          <div
            key={index}
            className="rounded-lg bg-gray-800 p-4 shadow-md transition-all-300 hover:bg-gray-750 hover:shadow-lg hover:shadow-emerald-900/10 border border-transparent hover:border-gray-700 overflow-hidden relative"
          >
            {/* Add subtle shimmer effect */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 animate-shimmer transition-opacity duration-300"></div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-sm md:text-base">
                  {tool.name}
                  {tool.status && (
                    <span className="ml-2 rounded-full bg-red-900 px-2 py-0.5 text-xs text-red-300">{tool.status}</span>
                  )}
                </h3>
                <p className="mt-1 text-xs md:text-sm text-emerald-400">{tool.records}</p>
              </div>
              <div className="rounded-full bg-gray-700 px-2 py-1 text-xs ml-2 transition-colors duration-300 hover:bg-emerald-900/50 hover:text-emerald-300">
                {index < 10 ? "Premium" : index < 30 ? "Standard" : "Basic"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination with responsive design */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white h-9 px-3 transition-all-300 hover:border-emerald-700"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-wrap gap-1 justify-center">
            {getVisiblePageNumbers().map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className={`h-9 w-9 transition-all-300 ${
                  currentPage === page
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20"
                    : "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-emerald-700"
                }`}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white h-9 px-3 transition-all-300 hover:border-emerald-700"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="mt-4 text-center text-sm text-gray-400">
        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTools.length)} of {filteredTools.length}{" "}
        providers
      </div>
    </div>
  )
}
