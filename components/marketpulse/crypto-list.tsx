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

interface Cryptocurrency {
  id: string
  name: string
  symbol: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  image: string
}

interface CryptoListProps {
  className?: string
}

export default function CryptoList({ className }: CryptoListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  const [cryptocurrencies, setCryptocurrencies] = useState<Cryptocurrency[]>([])
  const [filteredCryptos, setFilteredCryptos] = useState<Cryptocurrency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [paginatedCryptos, setPaginatedCryptos] = useState<Cryptocurrency[]>([])
  const [totalPages, setTotalPages] = useState(1)

  const fetchCryptoData = async () => {
    try {
      setError(null)
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h",
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setCryptocurrencies(data)
      setIsLoading(false)
      setIsRefreshing(false)
    } catch (err) {
      console.error("Error fetching cryptocurrency data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch cryptocurrency data")
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchCryptoData()
  }, [])

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchCryptoData()
  }

  // Filter and sort cryptocurrencies
  useEffect(() => {
    let result = [...cryptocurrencies]

    // Filter based on search term
    if (searchTerm) {
      result = result.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Sort if sortConfig is set
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = sortConfig.key.includes(".")
          ? sortConfig.key.split(".").reduce((obj, key) => obj[key], a)
          : a[sortConfig.key as keyof Cryptocurrency]

        const bValue = sortConfig.key.includes(".")
          ? sortConfig.key.split(".").reduce((obj, key) => obj[key], b)
          : b[sortConfig.key as keyof Cryptocurrency]

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    setFilteredCryptos(result)
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [searchTerm, sortConfig, cryptocurrencies])

  // Handle pagination
  useEffect(() => {
    if (filteredCryptos.length === 0) {
      setPaginatedCryptos([])
      setTotalPages(1)
      return
    }

    const totalPages = Math.ceil(filteredCryptos.length / itemsPerPage)
    setTotalPages(totalPages)

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedItems = filteredCryptos.slice(startIndex, endIndex)

    setPaginatedCryptos(paginatedItems)
  }, [filteredCryptos, currentPage, itemsPerPage])

  const requestSort = (key: string) => {
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
      minimumFractionDigits: num < 1 ? 4 : 2,
      maximumFractionDigits: num < 1 ? 6 : 2,
    }).format(num)
  }

  const formatMarketCap = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    return `$${num.toFixed(2)}`
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
              Cryptocurrency Market
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
              placeholder="Search cryptocurrency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 w-full"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-400 text-sm">
              {error}. Please try again later or check your connection.
            </p>
          </div>
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
                    onClick={() => requestSort("current_price")}
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
                    onClick={() => requestSort("price_change_percentage_24h")}
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
                    onClick={() => requestSort("market_cap")}
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
              ) : paginatedCryptos.length > 0 ? (
                paginatedCryptos.map((crypto) => (
                  <tr
                    key={crypto.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50 transition-colors cursor-pointer"
                    onClick={() => (window.location.href = `/crypto/${crypto.id}`)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link href={`/crypto/${crypto.id}`} className="flex items-center">
                        <Image
                          src={crypto.image || "/placeholder.svg"}
                          alt={crypto.name}
                          width={24}
                          height={24}
                          className="rounded-full mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white flex items-center">
                            {crypto.name}
                            <ExternalLink className="ml-1 h-3 w-3 opacity-50" />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{crypto.symbol.toUpperCase()}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(crypto.current_price)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          crypto.price_change_percentage_24h >= 0
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                        )}
                      >
                        {crypto.price_change_percentage_24h >= 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {crypto.price_change_percentage_24h >= 0 ? "+" : ""}
                        {crypto.price_change_percentage_24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {formatMarketCap(crypto.market_cap)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No cryptocurrencies found matching your search.
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
                <SelectValue placeholder="10" />
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
            Showing {filteredCryptos.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredCryptos.length)} of {filteredCryptos.length} entries
          </div>
        </div>
      </div>
    </div>
  )
}

