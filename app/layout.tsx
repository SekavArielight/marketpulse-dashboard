import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "MarketPulse Dashboard",
  description: "Stay ahead of the market with MarketPulse. Track your cryptocurrencies and stocks in real-time, and make informed investment decisions.",
  icons: {
    icon: "./mpulse-bg-black.png"
  },
  images: [
    {
      url: "http://marketpulse-dashboard.vercel.app/og-image.png",
      alt: "MarketPulse Dashboard Preview",
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'