"use client"

import { useState, useEffect } from "react"
import { Search, ArrowUpDown, TrendingUp, TrendingDown, RefreshCw, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap: number
  volume: number
  sector: string
  logo: string
}

// List of popular stock symbols to fetch
const STOCK_SYMBOLS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "TSLA",
  "META",
  "NVDA",
  "JPM",
  "V",
  "WMT",
  "PG",
  "JNJ",
  "UNH",
  "HD",
  "MA",
  "BAC",
  "PFE",
  "CSCO",
  "ADBE",
  "CRM",
]

interface StockListProps {
  className?: string
}

export default function StockList({ className }: StockListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: keyof Stock; direction: "ascending" | "descending" } | null>(null)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [paginatedStocks, setPaginatedStocks] = useState<Stock[]>([])
  const [totalPages, setTotalPages] = useState(1)

  // Fetch stock data from Alpha Vantage API
  const fetchStockData = async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Try to fetch from API, but expect it might fail with 401
      try {
        const response = await fetch(
          `https://financialmodelingprep.com/api/v3/quote/${STOCK_SYMBOLS.join(",")}?apikey=demo`,
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        // Transform the data to match our Stock interface
        const transformedData: Stock[] = data.map((item: any) => ({
          symbol: item.symbol,
          name: item.name,
          price: item.price,
          change: item.change,
          changePercent: item.changesPercentage,
          marketCap: item.marketCap,
          volume: item.volume,
          sector: item.sector || "N/A",
          logo: `/placeholder.svg?height=32&width=32&text=${item.symbol}`,
        }))

        setStocks(transformedData)
        setIsLoading(false)
        setIsRefreshing(false)
        return // Exit early if successful
      } catch (apiError) {
        console.error("API request failed:", apiError)
        // Continue to fallback data
      }

      // Generate realistic fallback data
      console.log("Using fallback stock data due to API limitations")
      setError("API access limited. Using sample data for demonstration purposes.")

      const fallbackData: Stock[] = [
        {
          symbol: "AAPL",
          name: "Apple Inc.",
          price: 187.32,
          change: 1.25,
          changePercent: 0.67,
          marketCap: 2950000000000,
          volume: 58900000,
          sector: "Technology",
          logo: "/placeholder.svg?height=32&width=32&text=AAPL",
        },
        {
          symbol: "MSFT",
          name: "Microsoft Corporation",
          price: 418.56,
          change: -2.34,
          changePercent: -0.56,
          marketCap: 3110000000000,
          volume: 21500000,
          sector: "Technology",
          logo: "/placeholder.svg?height=32&width=32&text=MSFT",
        },
        {
          symbol: "GOOGL",
          name: "Alphabet Inc.",
          price: 175.98,
          change: 3.45,
          changePercent: 2.0,
          marketCap: 2210000000000,
          volume: 25600000,
          sector: "Technology",
          logo: "/placeholder.svg?height=32&width=32&text=GOOGL",
        },
        {
          symbol: "AMZN",
          name: "Amazon.com Inc.",
          price: 178.75,
          change: -1.23,
          changePercent: -0.68,
          marketCap: 1850000000000,
          volume: 32100000,
          sector: "Consumer Cyclical",
          logo: "/placeholder.svg?height=32&width=32&text=AMZN",
        },
        {
          symbol: "TSLA",
          name: "Tesla, Inc.",
          price: 175.34,
          change: 5.67,
          changePercent: 3.34,
          marketCap: 557000000000,
          volume: 98700000,
          sector: "Automotive",
          logo: "/placeholder.svg?height=32&width=32&text=TSLA",
        },
        {
          symbol: "NVDA",
          name: "NVIDIA Corporation",
          price: 950.02,
          change: 23.45,
          changePercent: 2.53,
          marketCap: 2340000000000,
          volume: 45600000,
          sector: "Technology",
          logo: "/placeholder.svg?height=32&width=32&text=NVDA",
        },
        {
          symbol: "META",
          name: "Meta Platforms, Inc.",
          price: 487.95,
          change: -5.67,
          changePercent: -1.15,
          marketCap: 1250000000000,
          volume: 18900000,
          sector: "Technology",
          logo: "/placeholder.svg?height=32&width=32&text=META",
        },
        {
          symbol: "JPM",
          name: "JPMorgan Chase & Co.",
          price: 198.45,
          change: 1.23,
          changePercent: 0.62,
          marketCap: 573000000000,
          volume: 8900000,
          sector: "Financial Services",
          logo: "/placeholder.svg?height=32&width=32&text=JPM",
        },
        {
          symbol: "V",
          name: "Visa Inc.",
          price: 275.67,
          change: -0.89,
          changePercent: -0.32,
          marketCap: 560000000000,
          volume: 6700000,
          sector: "Financial Services",
          logo: "/placeholder.svg?height=32&width=32&text=V",
        },
        {
          symbol: "WMT",
          name: "Walmart Inc.",
          price: 67.89,
          change: 0.45,
          changePercent: 0.67,
          marketCap: 545000000000,
          volume: 7800000,
          sector: "Consumer Defensive",
          logo: "/placeholder.svg?height=32&width=32&text=WMT",
        },
        {
          symbol: "PG",
          name: "Procter & Gamble Co.",
          price: 165.78,
          change: 1.12,
          changePercent: 0.68,
          marketCap: 390000000000,
          volume: 5600000,
          sector: "Consumer Defensive",
          logo: "/placeholder.svg?height=32&width=32&text=PG",
        },
        {
          symbol: "JNJ",
          name: "Johnson & Johnson",
          price: 152.5,
          change: -0.75,
          changePercent: -0.49,
          marketCap: 367000000000,
          volume: 6200000,
          sector: "Healthcare",
          logo: "/placeholder.svg?height=32&width=32&text=JNJ",
        },
      ]

      setStocks(fallbackData)
      setIsLoading(false)
      setIsRefreshing(false)
    } catch (err) {
      console.error("Error in fetchStockData:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch stock data")
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchStockData()
  }, [])

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStockData()
  }

  // Filter and sort stocks
  useEffect(() => {
    let result = [...stocks]

    // Filter based on search term
    if (searchTerm) {
      result = result.filter(
        (stock) =>
          stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Sort if sortConfig is set
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    setFilteredStocks(result)
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [searchTerm, sortConfig, stocks])

  // Handle pagination
  useEffect(() => {
    if (filteredStocks.length === 0) {
      setPaginatedStocks([])
      setTotalPages(1)
      return
    }

    const totalPages = Math.ceil(filteredStocks.length / itemsPerPage)
    setTotalPages(totalPages)

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedItems = filteredStocks.slice(startIndex, endIndex)

    setPaginatedStocks(paginatedItems)
  }, [filteredStocks, currentPage, itemsPerPage])

  const requestSort = (key: keyof Stock) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  const formatMarketCap = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    return `$${num.toFixed(2)}`
  }

  const formatVolume = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toString()
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const renderPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    // Always show first page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink
          href="#"
          onClick={(e) => {
            e.preventDefault()
            handlePageChange(1)
          }}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Calculate range of visible pages
    let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3)

    if (endPage - startPage < maxVisiblePages - 3) {
      startPage = Math.max(2, endPage - (maxVisiblePages - 3) + 1)
    }

    // Add ellipsis after first page if needed
    if (startPage > 2) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Add visible page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(i)
            }}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(totalPages)
            }}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
              Stock Market
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="ml-2 h-8"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 w-full"
            />
          </div>
        </div>

        {error && (
          <Alert variant="warning" className="mb-6">
            <AlertTitle>Using Sample Data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#1F1F23]">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 -ml-2 font-medium"
                    onClick={() => requestSort("name")}
                  >
                    Name
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 -ml-2 font-medium"
                    onClick={() => requestSort("price")}
                  >
                    Price
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 -ml-2 font-medium"
                    onClick={() => requestSort("changePercent")}
                  >
                    24h Change
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 -ml-2 font-medium"
                    onClick={() => requestSort("marketCap")}
                  >
                    Market Cap
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-6 w-6 rounded-full mr-3" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right hidden md:table-cell">
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedStocks.length > 0 ? (
                paginatedStocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link href={`/stocks/${stock.symbol.toLowerCase()}`} className="flex items-center">
                        <Image
                          src={stock.logo || "/placeholder.svg"}
                          alt={stock.name}
                          width={24}
                          height={24}
                          className="rounded-full mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white flex items-center">
                            {stock.name}
                            <ExternalLink className="ml-1 h-3 w-3 opacity-50" />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{stock.symbol}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(stock.price)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          stock.changePercent >= 0
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                        )}
                      >
                        {stock.changePercent >= 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {stock.changePercent >= 0 ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {formatMarketCap(stock.marketCap)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No stocks found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder="5" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500 dark:text-gray-400">per page</span>
          </div>

          <Pagination className="w-full overflow-x-auto sm:w-auto">
            <PaginationContent className="min-w-max">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(currentPage - 1)
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {/* Only show first, current, and last page on mobile */}
              <div className="hidden sm:flex">{renderPaginationItems()}</div>

              {/* Simplified pagination for mobile */}
              <div className="flex sm:hidden">
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(1)
                    }}
                    isActive={currentPage === 1}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>

                {currentPage > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {currentPage > 1 && currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(currentPage)
                      }}
                      isActive={true}
                    >
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                )}

                {currentPage < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {totalPages > 1 && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(totalPages)
                      }}
                      isActive={currentPage === totalPages}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                )}
              </div>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            Showing {filteredStocks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredStocks.length)} of {filteredStocks.length} entries
          </div>
        </div>
      </div>
    </div>
  )
}

