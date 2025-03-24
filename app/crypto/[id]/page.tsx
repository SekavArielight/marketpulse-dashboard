"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Layout from "@/components/marketpulse/layout"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, BarChart2, Activity, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface CryptoData {
  id: string
  name: string
  symbol: string
  market_data: {
    current_price: {
      usd: number
    }
    price_change_percentage_24h: number
    market_cap: {
      usd: number
    }
    total_volume: {
      usd: number
    }
    circulating_supply: number
    max_supply: number | null
    ath: {
      usd: number
    }
    atl: {
      usd: number
    }
    ath_date: {
      usd: string
    }
    atl_date: {
      usd: string
    }
  }
  image: {
    large: string
  }
  description: {
    en: string
  }
  last_updated: string
}

interface MarketChartData {
  prices: [number, number][]
}

export default function CryptoDetailPage() {
  const params = useParams()
  const cryptoId = params.id as string
  const [crypto, setCrypto] = useState<CryptoData | null>(null)
  const [chartData, setChartData] = useState<{ date: string; price: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("1y")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchCryptoData = async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Fetch crypto details
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${cryptoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data: CryptoData = await response.json()
      setCrypto(data)

      // Fetch historical chart data
      await fetchChartData(timeRange)

      setIsLoading(false)
      setIsRefreshing(false)
    } catch (err) {
      console.error("Error fetching cryptocurrency data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch cryptocurrency data")
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const fetchChartData = async (days: string) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`,
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data: MarketChartData = await response.json()

      // Transform the data for the chart
      const formattedData = data.prices.map(([timestamp, price]) => ({
        date: new Date(timestamp).toISOString().split("T")[0],
        price,
      }))

      setChartData(formattedData)
    } catch (err) {
      console.error("Error fetching chart data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch chart data")
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchCryptoData()
  }, [cryptoId])

  // Handle time range change
  useEffect(() => {
    if (crypto) {
      fetchChartData(timeRange)
    }
  }, [timeRange, crypto])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchCryptoData()
  }

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
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

  const formatSupply = (num: number) => {
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
            <Link href="/crypto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cryptocurrencies
            </Link>
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || isRefreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}. Please try again later or check your connection.</AlertDescription>
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
        ) : crypto ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Image
                  src={crypto.image.large || "/placeholder.svg"}
                  alt={crypto.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{crypto.name}</h1>
                  <p className="text-gray-500 dark:text-gray-400">{crypto.symbol.toUpperCase()} • Cryptocurrency</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(crypto.market_data.current_price.usd)}
                </div>
                <div
                  className={cn(
                    "flex items-center text-sm",
                    crypto.market_data.price_change_percentage_24h >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {crypto.market_data.price_change_percentage_24h >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  {crypto.market_data.price_change_percentage_24h >= 0 ? "+" : ""}
                  {crypto.market_data.price_change_percentage_24h.toFixed(2)}%
                </div>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Price Chart</CardTitle>
                  <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className="h-8 w-[80px]">
                      <SelectValue placeholder="1y" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1D</SelectItem>
                      <SelectItem value="7">7D</SelectItem>
                      <SelectItem value="30">1M</SelectItem>
                      <SelectItem value="90">3M</SelectItem>
                      <SelectItem value="180">6M</SelectItem>
                      <SelectItem value="365">1Y</SelectItem>
                      <SelectItem value="max">Max</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription>Historical price data for {crypto.symbol.toUpperCase()}</CardDescription>
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
                    Market Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Market Cap</dt>
                      <dd className="font-medium">{formatMarketCap(crypto.market_data.market_cap.usd)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">24h Volume</dt>
                      <dd className="font-medium">{formatMarketCap(crypto.market_data.total_volume.usd)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Circulating Supply</dt>
                      <dd className="font-medium">{formatSupply(crypto.market_data.circulating_supply)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Max Supply</dt>
                      <dd className="font-medium">
                        {crypto.market_data.max_supply ? formatSupply(crypto.market_data.max_supply) : "∞"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    Price Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">All Time High</dt>
                      <dd className="font-medium">${crypto.market_data.ath.usd.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">All Time Low</dt>
                      <dd className="font-medium">${crypto.market_data.atl.usd.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">ATH Date</dt>
                      <dd className="font-medium">{new Date(crypto.market_data.ath_date.usd).toLocaleDateString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">ATL Date</dt>
                      <dd className="font-medium">{new Date(crypto.market_data.atl_date.usd).toLocaleDateString()}</dd>
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
                    {crypto.description.en ? (
                      <span dangerouslySetInnerHTML={{ __html: crypto.description.en }} />
                    ) : (
                      "No description available."
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Cryptocurrency Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              The cryptocurrency you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/crypto">Return to Cryptocurrencies</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
}

