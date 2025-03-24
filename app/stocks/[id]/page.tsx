"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Layout from "@/components/marketpulse/layout"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, BarChart2, Activity, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface StockProfile {
  symbol: string
  name: string
  price: number
  changes: number
  changesPercentage: number
  marketCap: number
  volume: number
  sector: string
  description: string
  exchange: string
  industry: string
  ceo: string
  website: string
  employees: number
  beta: number
  volAvg: number
  lastDiv: number
  range: string
}

interface StockHistoricalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Company name mapping for symbols
const COMPANY_NAMES: Record<string, string> = {
  aapl: "Apple Inc.",
  msft: "Microsoft Corporation",
  googl: "Alphabet Inc.",
  amzn: "Amazon.com Inc.",
  tsla: "Tesla, Inc.",
  meta: "Meta Platforms, Inc.",
  nvda: "NVIDIA Corporation",
  jpm: "JPMorgan Chase & Co.",
  v: "Visa Inc.",
  wmt: "Walmart Inc.",
  pg: "Procter & Gamble Co.",
  jnj: "Johnson & Johnson",
  unh: "UnitedHealth Group Inc.",
  hd: "Home Depot Inc.",
  ma: "Mastercard Inc.",
  bac: "Bank of America Corp.",
  pfe: "Pfizer Inc.",
  csco: "Cisco Systems, Inc.",
  adbe: "Adobe Inc.",
  crm: "Salesforce, Inc.",
}

// Sector mapping for symbols
const SECTOR_MAPPING: Record<string, string> = {
  aapl: "Technology",
  msft: "Technology",
  googl: "Technology",
  amzn: "Consumer Cyclical",
  tsla: "Automotive",
  meta: "Technology",
  nvda: "Technology",
  jpm: "Financial Services",
  v: "Financial Services",
  wmt: "Consumer Defensive",
  pg: "Consumer Defensive",
  jnj: "Healthcare",
  unh: "Healthcare",
  hd: "Consumer Cyclical",
  ma: "Financial Services",
  bac: "Financial Services",
  pfe: "Healthcare",
  csco: "Technology",
  adbe: "Technology",
  crm: "Technology",
}

// Alpha Vantage API key
const ALPHA_VANTAGE_API_KEY = "PILT557MDETIAVVK"

export default function StockDetailPage() {
  const params = useParams()
  const stockSymbol = params.id as string
  const [stock, setStock] = useState<StockProfile | null>(null)
  const [chartData, setChartData] = useState<{ date: string; price: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("1year")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update the fetchStockData function to use Alpha Vantage API
  const fetchStockData = async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Try to fetch company overview from Alpha Vantage
      try {
        // First, get the current quote
        const quoteResponse = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockSymbol.toUpperCase()}&apikey=${ALPHA_VANTAGE_API_KEY}`,
        )

        if (!quoteResponse.ok) {
          throw new Error(`API error: ${quoteResponse.status}`)
        }

        const quoteData = await quoteResponse.json()

        // Check if we got a valid response
        if (!quoteData["Global Quote"] || Object.keys(quoteData["Global Quote"]).length === 0) {
          throw new Error("Stock not found or API limit reached")
        }

        const quote = quoteData["Global Quote"]

        // Then, get the company overview
        const overviewResponse = await fetch(
          `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${stockSymbol.toUpperCase()}&apikey=${ALPHA_VANTAGE_API_KEY}`,
        )

        if (!overviewResponse.ok) {
          throw new Error(`API error: ${overviewResponse.status}`)
        }

        const overviewData = await overviewResponse.json()

        // Check if we got a valid response
        if (!overviewData.Symbol) {
          // We might have hit the API limit, use fallback data with the quote we already have
          const stockProfile: StockProfile = {
            symbol: stockSymbol.toUpperCase(),
            name: COMPANY_NAMES[stockSymbol.toLowerCase()] || `${stockSymbol.toUpperCase()} Inc.`,
            price: Number.parseFloat(quote["05. price"]),
            changes: Number.parseFloat(quote["09. change"]),
            changesPercentage: Number.parseFloat(quote["10. change percent"].replace("%", "")),
            marketCap: 0, // We don't have this from the quote
            volume: Number.parseInt(quote["06. volume"]),
            sector: SECTOR_MAPPING[stockSymbol.toLowerCase()] || "Technology",
            description: `This is a sample description for ${COMPANY_NAMES[stockSymbol.toLowerCase()] || stockSymbol.toUpperCase()}. In a production environment, this would be actual company data from the API.`,
            exchange: "NASDAQ",
            industry: SECTOR_MAPPING[stockSymbol.toLowerCase()] || "Technology",
            ceo: "N/A",
            website: "https://example.com",
            employees: 0,
            beta: 1.0,
            volAvg: Number.parseInt(quote["06. volume"]),
            lastDiv: 0,
            range: "N/A",
          }

          setStock(stockProfile)
          setError("Limited API data available. Using partial real data with some sample data.")
        } else {
          // We have both quote and overview data
          const stockProfile: StockProfile = {
            symbol: overviewData.Symbol,
            name: overviewData.Name,
            price: Number.parseFloat(quote["05. price"]),
            changes: Number.parseFloat(quote["09. change"]),
            changesPercentage: Number.parseFloat(quote["10. change percent"].replace("%", "")),
            marketCap: Number.parseFloat(overviewData.MarketCapitalization) || 0,
            volume: Number.parseInt(quote["06. volume"]),
            sector: overviewData.Sector || SECTOR_MAPPING[stockSymbol.toLowerCase()] || "N/A",
            description: overviewData.Description || `No description available for ${overviewData.Name}.`,
            exchange: overviewData.Exchange || "N/A",
            industry: overviewData.Industry || "N/A",
            ceo: overviewData.CEO || "N/A",
            website: overviewData.Website || "N/A",
            employees: Number.parseInt(overviewData.FullTimeEmployees) || 0,
            beta: Number.parseFloat(overviewData.Beta) || 1.0,
            volAvg: Number.parseInt(overviewData.VolumeAvg) || Number.parseInt(quote["06. volume"]),
            lastDiv: Number.parseFloat(overviewData.DividendYield) || 0,
            range: overviewData["52WeekRange"] || "N/A",
          }

          setStock(stockProfile)
        }

        // Fetch historical data
        await fetchHistoricalData(timeRange)

        setIsLoading(false)
        setIsRefreshing(false)
        return // Exit early if successful
      } catch (apiError) {
        console.error("API request failed:", apiError)
        // Continue to fallback data
      }

      // Generate fallback data if API fails
      console.log("Using fallback stock data due to API limitations")
      setError("API access limited. Using sample data for demonstration purposes.")

      // Create a fallback stock profile
      const fallbackStock = createFallbackStockProfile(stockSymbol)
      setStock(fallbackStock)

      // Generate fallback chart data
      const fallbackChartData = generateFallbackChartData(timeRange)
      setChartData(fallbackChartData)

      setIsLoading(false)
      setIsRefreshing(false)
    } catch (err) {
      console.error("Error in fetchStockData:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch stock data")

      if (err instanceof Error && err.message === "Stock not found") {
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      // Create a fallback stock profile
      const fallbackStock = createFallbackStockProfile(stockSymbol)
      setStock(fallbackStock)

      // Generate fallback chart data
      const fallbackChartData = generateFallbackChartData(timeRange)
      setChartData(fallbackChartData)

      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Helper function to create a fallback stock profile
  const createFallbackStockProfile = (symbol: string): StockProfile => {
    const upperSymbol = symbol.toUpperCase()
    const lowerSymbol = symbol.toLowerCase()

    return {
      symbol: upperSymbol,
      name: COMPANY_NAMES[lowerSymbol] || `${upperSymbol} Inc.`,
      price: 150 + Math.random() * 300,
      changes: (Math.random() - 0.5) * 10,
      changesPercentage: (Math.random() - 0.5) * 5,
      marketCap: Math.random() * 1000000000000,
      volume: Math.random() * 50000000,
      sector: SECTOR_MAPPING[lowerSymbol] || "Technology",
      description: `This is a sample description for ${COMPANY_NAMES[lowerSymbol] || upperSymbol}. In a production environment, this would be actual company data from the API.`,
      exchange: "NASDAQ",
      industry: SECTOR_MAPPING[lowerSymbol] || "Technology",
      ceo: "John Doe",
      website: "https://example.com",
      employees: Math.floor(Math.random() * 100000),
      beta: 1 + Math.random(),
      volAvg: Math.random() * 20000000,
      lastDiv: Math.random() * 5,
      range: `${(100 + Math.random() * 50).toFixed(2)} - ${(200 + Math.random() * 100).toFixed(2)}`,
    }
  }

  // Update the fetchHistoricalData function to use Alpha Vantage API
  const fetchHistoricalData = async (period: string) => {
    try {
      // Map our time range to Alpha Vantage's outputsize parameter
      let outputsize = "compact" // Default to 100 data points
      if (period === "1year" || period === "5years") {
        outputsize = "full" // Get full data (up to 20 years)
      }

      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stockSymbol.toUpperCase()}&outputsize=${outputsize}&apikey=${ALPHA_VANTAGE_API_KEY}`,
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        // Check if we got a valid response
        if (!data["Time Series (Daily)"] || Object.keys(data["Time Series (Daily)"]).length === 0) {
          throw new Error("No historical data available or API limit reached")
        }

        // Transform the data for the chart
        const timeSeriesData = data["Time Series (Daily)"]
        const dates = Object.keys(timeSeriesData).sort() // Sort dates in ascending order

        // Filter dates based on the selected time range
        const filteredDates = filterDatesByTimeRange(dates, period)

        const formattedData = filteredDates.map((date) => ({
          date,
          price: Number.parseFloat(timeSeriesData[date]["4. close"]),
        }))

        setChartData(formattedData)
        return // Exit early if successful
      } catch (apiError) {
        console.error("Historical data API request failed:", apiError)
        // Continue to fallback data
      }

      // Generate fallback chart data
      const fallbackData = generateFallbackChartData(period)
      setChartData(fallbackData)
    } catch (err) {
      console.error("Error in fetchHistoricalData:", err)

      // Generate fallback chart data
      const fallbackData = generateFallbackChartData(period)
      setChartData(fallbackData)
    }
  }

  // Helper function to filter dates based on time range
  const filterDatesByTimeRange = (dates: string[], period: string): string[] => {
    const today = new Date()
    const cutoffDate = new Date()

    switch (period) {
      case "1month":
        cutoffDate.setMonth(today.getMonth() - 1)
        break
      case "3months":
        cutoffDate.setMonth(today.getMonth() - 3)
        break
      case "6months":
        cutoffDate.setMonth(today.getMonth() - 6)
        break
      case "1year":
        cutoffDate.setFullYear(today.getFullYear() - 1)
        break
      case "5years":
        cutoffDate.setFullYear(today.getFullYear() - 5)
        break
      default:
        cutoffDate.setFullYear(today.getFullYear() - 1) // Default to 1 year
    }

    return dates.filter((date) => new Date(date) >= cutoffDate)
  }

  const generateFallbackChartData = (period: string) => {
    const data = []
    const today = new Date()
    let days

    switch (period) {
      case "1month":
        days = 30
        break
      case "3months":
        days = 90
        break
      case "6months":
        days = 180
        break
      case "1year":
      default:
        days = 365
        break
      case "5years":
        days = 1825
        break
    }

    let basePrice = 150
    const volatility = 0.02

    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)

      // Random walk price model
      const change = basePrice * volatility * (Math.random() - 0.5)
      basePrice += change

      data.push({
        date: date.toISOString().split("T")[0],
        price: basePrice,
      })
    }

    return data
  }

  // Initial data fetch
  useEffect(() => {
    fetchStockData()
  }, [stockSymbol])

  // Handle time range change
  useEffect(() => {
    if (stock) {
      fetchHistoricalData(timeRange)
    }
  }, [timeRange, stock])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStockData()
  }

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
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
    return num.toLocaleString()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/stocks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stocks
            </Link>
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || isRefreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="warning">
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        ) : stock ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg font-bold">
                  {stock.symbol.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{stock.name}</h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    {stock.symbol} • {stock.exchange}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(stock.price)}</div>
                <div
                  className={cn(
                    "flex items-center text-sm",
                    stock.changesPercentage >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {stock.changesPercentage >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  {stock.changes >= 0 ? "+" : ""}
                  {formatNumber(stock.changes)} ({stock.changesPercentage >= 0 ? "+" : ""}
                  {stock.changesPercentage.toFixed(2)}%)
                </div>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Price Chart</CardTitle>
                  <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className="h-8 w-[80px]">
                      <SelectValue placeholder="1year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1month">1M</SelectItem>
                      <SelectItem value="3months">3M</SelectItem>
                      <SelectItem value="6months">6M</SelectItem>
                      <SelectItem value="1year">1Y</SelectItem>
                      <SelectItem value="5years">5Y</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription>Historical price data for {stock.symbol}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] sm:h-[600px] w-full">
                  {chartData.length > 0 ? (
                    <ChartContainer
                      config={{
                        price: {
                          label: "Price",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis
                            dataKey="date"
                            stroke="var(--muted-foreground)"
                            tickFormatter={(value) => {
                              const date = new Date(value)
                              return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            }}
                          />
                          <YAxis
                            stroke="var(--muted-foreground)"
                            domain={["auto", "auto"]}
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                          />
                          <Tooltip
                            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Price"]}
                            labelFormatter={(label) => {
                              const date = new Date(label)
                              return date.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="var(--color-price)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <p className="text-muted-foreground">No chart data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Fundamentals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Market Cap</dt>
                      <dd className="font-medium">{formatMarketCap(stock.marketCap)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Beta</dt>
                      <dd className="font-medium">{stock.beta.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Dividend</dt>
                      <dd className="font-medium">${stock.lastDiv.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Employees</dt>
                      <dd className="font-medium">{stock.employees > 0 ? stock.employees.toLocaleString() : "N/A"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    Trading Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">52 Week Range</dt>
                      <dd className="font-medium">{stock.range}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Volume</dt>
                      <dd className="font-medium">{formatVolume(stock.volume)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Avg. Volume</dt>
                      <dd className="font-medium">{formatVolume(stock.volAvg)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Exchange</dt>
                      <dd className="font-medium">{stock.exchange}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-[7]">
                    {stock.description || "No description available."}
                  </p>
                  {stock.website && stock.website !== "N/A" && (
                    <a
                      href={stock.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-2 inline-block"
                    >
                      Visit Website
                    </a>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Stock Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              The stock you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/stocks">Return to Stocks</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
}

