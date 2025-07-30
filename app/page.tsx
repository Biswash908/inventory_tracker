"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getClientSideSupabase } from "@/lib/supabase-browser"

interface StockItem {
  id: string
  name: string
  sku: string
  unit_cost: number
  unit_price: number
  quantity: number
  category: string
  // user_id: string // Removed
  created_at: string
}

interface SaleItem {
  id: string
  date: string
  product: string
  quantity_sold: number
  unit_price: number
  unit_cost: number
  total_sale: number
  // user_id: string // Removed
  created_at: string
}

interface PendingItem {
  id: string
  date: string
  product: string
  quantity_sent: number
  unit_price: number
  unit_cost: number
  status: string
  // user_id: string // Removed
  created_at: string
}

export default function Dashboard() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [salesItems, setSalesItems] = useState<SaleItem[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getClientSideSupabase()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      // No need to fetch user_id for filtering anymore
      // const { data: userData, error: userError } = await supabase.auth.getUser()
      // if (userError || !userData?.user) {
      //   console.error("Error fetching user:", userError?.message)
      //   setLoading(false)
      //   return
      // }
      // const userId = userData.user.id // Removed

      try {
        // Removed .eq("user_id", userId) filter
        const { data: stockData, error: stockError } = await supabase.from("stock").select("*")
        if (stockError) throw stockError
        setStockItems(stockData as StockItem[])

        // Removed .eq("user_id", userId) filter
        const { data: salesData, error: salesError } = await supabase.from("sales").select("*")
        if (salesError) throw salesError
        setSalesItems(salesData as SaleItem[])

        // Removed .eq("user_id", userId) filter
        const { data: pendingData, error: pendingError } = await supabase.from("pending").select("*")
        if (pendingError) throw pendingError
        setPendingItems(pendingData as PendingItem[])
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading dashboard data...</p>
      </div>
    )
  }

  const totalStockValue = stockItems.reduce((sum, item) => sum + item.unit_cost * item.quantity, 0)
  const totalSalesValue = salesItems.reduce((sum, item) => sum + item.total_sale, 0)
  const totalCostOfSales = salesItems.reduce((sum, item) => sum + item.unit_cost * item.quantity_sold, 0)
  const totalPendingValue = pendingItems.reduce((sum, item) => sum + item.quantity_sent * item.unit_price, 0)
  const totalItems = stockItems.reduce((sum, item) => sum + item.quantity, 0)

  const profitMargin =
    totalSalesValue === 0 ? "0.0" : (((totalSalesValue - totalCostOfSales) / totalSalesValue) * 100).toFixed(1)

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your Electronics Inventory</h1>
        <p className="text-gray-600">
          Monitor your electronics inventory, track sales, and manage pending deliveries all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost of Inventory</CardTitle>
            <Package className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {totalStockValue.toLocaleString()}</div>
            <p className="text-xs text-blue-100">{totalItems} items in stock</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Revenue</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {totalSalesValue.toLocaleString()}</div>
            <p className="text-xs text-green-100">{salesItems.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Value</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {totalPendingValue.toLocaleString()}</div>
            <p className="text-xs text-orange-100">{pendingItems.length} pending deliveries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <ShoppingCart className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin}%</div>
            <p className="text-xs text-purple-100">On total sales</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Stock Management
            </CardTitle>
            <CardDescription>Manage your inventory and track stock levels</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/stock"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full"
            >
              Manage Stock
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Sales Tracking
            </CardTitle>
            <CardDescription>Record and monitor your sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/sales"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2 w-full"
            >
              View Sales
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Pending Deliveries
            </CardTitle>
            <CardDescription>Track orders awaiting delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/pending"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-600 text-white hover:bg-orange-700 h-10 px-4 py-2 w-full"
            >
              View Pending
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
