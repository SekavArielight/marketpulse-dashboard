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
  marketCap: number | null
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

// Company name mapping for symbols
const COMPANY_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  TSLA: "Tesla, Inc.",
  META: "Meta Platforms, Inc.",
  NVDA: "NVIDIA Corporation",
  JPM: "JPMorgan Chase & Co.",
  V: "Visa Inc.",
  WMT: "Walmart Inc.",
  PG: "Procter & Gamble Co.",
  JNJ: "Johnson & Johnson",
  UNH: "UnitedHealth Group Inc.",
  HD: "Home Depot Inc.",
  MA: "Mastercard Inc.",
  BAC: "Bank of America Corp.",
  PFE: "Pfizer Inc.",
  CSCO: "Cisco Systems, Inc.",
  ADBE: "Adobe Inc.",
  CRM: "Salesforce, Inc.",
}

// Sector mapping for symbols
const SECTOR_MAPPING: Record<string, string> = {
  AAPL: "Technology",
  MSFT: "Technology",
  GOOGL: "Technology",
  AMZN: "Consumer Cyclical",
  TSLA: "Automotive",
  META: "Technology",
  NVDA: "Technology",
  JPM: "Financial Services",
  V: "Financial Services",
  WMT: "Consumer Defensive",
  PG: "Consumer Defensive",
  JNJ: "Healthcare",
  UNH: "Healthcare",
  HD: "Consumer Cyclical",
  MA: "Financial Services",
  BAC: "Financial Services",
  PFE: "Healthcare",
  CSCO: "Technology",
  ADBE: "Technology",
  CRM: "Technology",
}

interface StockListProps {
  className?: string
}

// Alpha Vantage API key
const ALPHA_VANTAGE_API_KEY = "PILT557MDETIAVVK"

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

      // Alpha Vantage has a limit of 5 API calls per minute on the free tier
      // We'll fetch data for the first 5 stocks and use fallback data for the rest
      const stocksToFetch = STOCK_SYMBOLS.slice(0, 5)
      const stockPromises = stocksToFetch.map(async (symbol) => {
        try {
          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
          )

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }

          const data = await response.json()

          // Check if we got a valid response
          if (data["Global Quote"] && Object.keys(data["Global Quote"]).length > 0) {
            const quote = data["Global Quote"]
            return {
              symbol: symbol,
              name: COMPANY_NAMES[symbol] || `${symbol} Inc.`,
              price: Number.parseFloat(quote["05. price"]),
              change: Number.parseFloat(quote["09. change"]),
              changePercent: Number.parseFloat(quote["10. change percent"].replace("%", "")),
              marketCap: null, // Alpha Vantage doesn't provide market cap in this endpoint
              volume: Number.parseInt(quote["06. volume"]),
              sector: SECTOR_MAPPING[symbol] || "N/A",
              logo: `/placeholder.svg?height=32&width=32&text=${symbol}`,
            }
          } else {
            throw new Error("Invalid response format")
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error)
          // Return fallback data for this symbol
          return createFallbackStock(symbol)
        }
      })

      // Wait for all promises to resolve
      const fetchedStocks = await Promise.all(stockPromises)

      // Create fallback data for the remaining stocks
      const remainingStocks = STOCK_SYMBOLS.slice(5).map((symbol) => createFallbackStock(symbol))

      // Combine fetched and fallback stocks
      const allStocks = [...fetchedStocks, ...remainingStocks]

      setStocks(allStocks)

      if (fetchedStocks.length < stocksToFetch.length) {
        setError("Some stock data could not be fetched. Using partial sample data.")
      } else if (remainingStocks.length > 0) {
        setError("API rate limit reached. Using sample data for some stocks.")
      }

      setIsLoading(false)
      setIsRefreshing(false)
    } catch (err) {
      console.error("Error in fetchStockData:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch stock data")

      // Use fallback data for all stocks
      const fallbackStocks = STOCK_SYMBOLS.map((symbol) => createFallbackStock(symbol))
      setStocks(fallbackStocks)

      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Helper function to create fallback stock data
  const createFallbackStock = (symbol: string): Stock => {
    // Generate realistic but random data based on the symbol
    const basePrice = symbol.length * 10 + Math.random() * 100
    const change = (Math.random() - 0.5) * 5
    const changePercent = (change / basePrice) * 100

    return {
      symbol,
      name: COMPANY_NAMES[symbol] || `${symbol} Inc.`,
      price: basePrice,
      change,
      changePercent,
      marketCap: Math.random() * 1000000000000,
      volume: Math.floor(Math.random() * 10000000),
      sector: SECTOR_MAPPING[symbol] || "Technology",
      logo: `/placeholder.svg?height=32&width=32&text=${symbol}`,
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
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        // Handle null values
        if (aValue === null && bValue === null) return 0
        if (aValue === null) return sortConfig.direction === "ascending" ? -1 : 1
        if (bValue === null) return sortConfig.direction === "ascending" ? 1 : -1

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (aValue > bValue) {
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

  const formatMarketCap = (num: number | null) => {
    if (num === null) return "N/A"
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
            <AlertTitle>Note</AlertTitle>
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

