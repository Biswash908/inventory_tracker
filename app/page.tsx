"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface StockItem {
  id: string
  name: string
  sku: string
  unitCost: number
  unitPrice: number
  quantity: number
}

interface SaleItem {
  id: string
  date: string
  product: string
  quantitySold: number
  unitPrice: number
  unitCost: number // Added unitCost to SaleItem
  totalSale: number
}

interface PendingItem {
  id: string
  date: string
  product: string
  quantitySent: number
  unitPrice: number
  unitCost: number // Added unitCost to PendingItem
  status: string
}

export default function Dashboard() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [salesItems, setSalesItems] = useState<SaleItem[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])

  useEffect(() => {
    // Load data from localStorage
    const savedStock = localStorage.getItem("inventory-stock")
    const savedSales = localStorage.getItem("inventory-sales")
    const savedPending = localStorage.getItem("inventory-pending")

    if (savedStock) {
      setStockItems(JSON.parse(savedStock))
    } else {
      // Default data
      const defaultStock = [
        { id: "1", name: "Samsung Galaxy A54", sku: "SGH-A54", unitCost: 45000, unitPrice: 52000, quantity: 25 },
        { id: "2", name: "iPhone 13", sku: "APL-IP13", unitCost: 95000, unitPrice: 110000, quantity: 15 },
        { id: "3", name: "Sony WH-1000XM4", sku: "SNY-WH4", unitCost: 28000, unitPrice: 35000, quantity: 40 },
        { id: "4", name: "MacBook Air M2", sku: "APL-MBA2", unitCost: 125000, unitPrice: 145000, quantity: 8 },
      ]
      setStockItems(defaultStock)
      localStorage.setItem("inventory-stock", JSON.stringify(defaultStock))
    }

    if (savedSales) {
      setSalesItems(JSON.parse(savedSales))
    } else {
      const defaultSales = [
        {
          id: "1",
          date: "2025-07-30",
          product: "Samsung Galaxy A54",
          quantitySold: 2,
          unitPrice: 52000,
          unitCost: 45000, // Added default unitCost
          totalSale: 104000,
        },
        {
          id: "2",
          date: "2025-07-29",
          product: "Sony WH-1000XM4",
          quantitySold: 1,
          unitPrice: 35000,
          unitCost: 28000, // Added default unitCost
          totalSale: 35000,
        },
      ]
      setSalesItems(defaultSales)
      localStorage.setItem("inventory-sales", JSON.stringify(defaultSales))
    }

    if (savedPending) {
      setPendingItems(JSON.parse(savedPending))
    } else {
      const defaultPending = [
        {
          id: "1",
          date: "2025-07-30",
          product: "iPhone 13",
          quantitySent: 1,
          unitPrice: 110000,
          unitCost: 95000,
          status: "Pending",
        },
        {
          id: "2",
          date: "2025-07-29",
          product: "MacBook Air M2",
          quantitySent: 1,
          unitPrice: 145000,
          unitCost: 125000,
          status: "Shipped",
        },
      ]
      setPendingItems(defaultPending)
      localStorage.setItem("inventory-pending", JSON.stringify(defaultPending))
    }
  }, [])

  const totalStockValue = stockItems.reduce((sum, item) => sum + item.unitCost * item.quantity, 0)
  const totalSalesValue = salesItems.reduce((sum, item) => sum + item.totalSale, 0)
  const totalCostOfSales = salesItems.reduce((sum, item) => sum + item.unitCost * item.quantitySold, 0) // Calculate total cost of goods sold
  const totalPendingValue = pendingItems.reduce((sum, item) => sum + item.quantitySent * item.unitPrice, 0)
  const totalItems = stockItems.reduce((sum, item) => sum + item.quantity, 0)

  const profitMargin =
    totalSalesValue === 0
      ? "0.0" // Display "0.0" if no sales to avoid NaN
      : (((totalSalesValue - totalCostOfSales) / totalSalesValue) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-indigo-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">Inventory Dashboard</span>
            </div>
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-indigo-600 font-medium border-b-2 border-indigo-600 pb-1">
                Home
              </Link>
              <Link href="/stock" className="text-gray-500 hover:text-gray-700 font-medium">
                Stock
              </Link>
              <Link href="/sales" className="text-gray-500 hover:text-gray-700 font-medium">
                Sales
              </Link>
              <Link href="/pending" className="text-gray-500 hover:text-gray-700 font-medium">
                Pending
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
    </div>
  )
}
