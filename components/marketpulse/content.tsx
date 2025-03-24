import { Calendar, CreditCard, Wallet } from "lucide-react"
import CryptoList from "./crypto-list"
import StockList from "./stock-list"

export default function () {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6">
      <CryptoList />
      <StockList />
      </div>
    </div>
  )
}

