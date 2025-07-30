"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Save, X, Download, Upload } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { exportToCsv, importFromCsv } from "@/lib/csv"

interface PendingItem {
  id: string
  date: string
  product: string
  quantitySent: number
  unitPrice: number
  unitCost: number
  status: string
}

interface StockItem {
  id: string
  name: string
  sku: string
  unitCost: number
  unitPrice: number
  quantity: number
}

// Define SaleItem interface here for use in this file
interface SaleItem {
  id: string
  date: string
  product: string
  quantitySold: number
  unitPrice: number
  unitCost: number
  totalSale: number
}

export default function PendingPage() {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<PendingItem | null>(null)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [salesItems, setSalesItems] = useState<SaleItem[]>([]) // State to manage sales data
  const [isCustomProductSelected, setIsCustomProductSelected] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedPending = localStorage.getItem("inventory-pending")
    const savedStock = localStorage.getItem("inventory-stock")
    const savedSales = localStorage.getItem("inventory-sales") // Load sales data

    if (savedStock) {
      setStockItems(JSON.parse(savedStock))
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

    if (savedSales) {
      setSalesItems(JSON.parse(savedSales))
    } else {
      // Initialize with default sales if none exist
      const defaultSales = [
        {
          id: "1",
          date: "2025-07-30",
          product: "Samsung Galaxy A54",
          quantitySold: 2,
          unitPrice: 52000,
          unitCost: 45000,
          totalSale: 104000,
        },
        {
          id: "2",
          date: "2025-07-29",
          product: "Sony WH-1000XM4",
          quantitySold: 1,
          unitPrice: 35000,
          unitCost: 28000,
          totalSale: 35000,
        },
      ]
      setSalesItems(defaultSales)
      localStorage.setItem("inventory-sales", JSON.stringify(defaultSales))
    }
  }, [])

  const savePendingToLocalStorage = (items: PendingItem[]) => {
    localStorage.setItem("inventory-pending", JSON.stringify(items))
  }

  const saveSalesToLocalStorage = (items: SaleItem[]) => {
    localStorage.setItem("inventory-sales", JSON.stringify(items))
  }

  const saveStockToLocalStorage = (items: StockItem[]) => {
    localStorage.setItem("inventory-stock", JSON.stringify(items))
  }

  const addNewPending = () => {
    const today = new Date().toISOString().split("T")[0]
    const newPending: PendingItem = {
      id: Date.now().toString(),
      date: today,
      product: "",
      quantitySent: 1,
      unitPrice: 0,
      unitCost: 0,
      status: "Pending",
    }
    const updatedItems = [...pendingItems, newPending]
    setPendingItems(updatedItems)
    savePendingToLocalStorage(updatedItems)
    setEditingId(newPending.id)
    setEditingItem(newPending)
    setIsCustomProductSelected(false)
  }

  const startEditing = (item: PendingItem) => {
    setEditingId(item.id)
    setEditingItem({ ...item })
    const isProductInStock = stockItems.some((stock) => stock.name === item.product)
    setIsCustomProductSelected(!isProductInStock)
  }

  const saveEdit = () => {
    if (editingItem) {
      let updatedPendingItems = pendingItems.map((item) => (item.id === editingItem.id ? editingItem : item))
      let updatedSalesItems = [...salesItems]
      const updatedStockItems = [...stockItems]

      // Check if the item is being marked as Delivered or Shipped
      if (editingItem.status === "Delivered" || editingItem.status === "Shipped") {
        // Decrement quantity in stock
        const stockIndex = updatedStockItems.findIndex((stock) => stock.name === editingItem.product)
        if (stockIndex !== -1) {
          updatedStockItems[stockIndex] = {
            ...updatedStockItems[stockIndex],
            quantity: updatedStockItems[stockIndex].quantity - editingItem.quantitySent,
          }
          alert(`Stock quantity for "${editingItem.product}" updated.`)
        }
      }

      if (editingItem.status === "Delivered") {
        // Create a new SaleItem from the delivered PendingItem
        const newSale: SaleItem = {
          id: Date.now().toString(), // New ID for the sale item
          date: new Date().toISOString().split("T")[0], // Current date for sale
          product: editingItem.product,
          quantitySold: editingItem.quantitySent,
          unitPrice: editingItem.unitPrice,
          unitCost: editingItem.unitCost,
          totalSale: editingItem.quantitySent * editingItem.unitPrice,
        }
        updatedSalesItems = [...salesItems, newSale]
        // Remove the item from pending
        updatedPendingItems = updatedPendingItems.filter((item) => item.id !== editingItem.id)
        alert(`Item "${editingItem.product}" marked as Delivered and moved to Sales!`)
      } else if (editingItem.status === "Cancelled") {
        // If cancelled, remove from pending without adding to sales or affecting stock (already handled above)
        updatedPendingItems = updatedPendingItems.filter((item) => item.id !== editingItem.id)
        alert(`Item "${editingItem.product}" has been cancelled and removed from pending.`)
      }

      setPendingItems(updatedPendingItems)
      savePendingToLocalStorage(updatedPendingItems)

      setSalesItems(updatedSalesItems)
      saveSalesToLocalStorage(updatedSalesItems)

      setStockItems(updatedStockItems) // Update stock state
      saveStockToLocalStorage(updatedStockItems) // Save updated stock to local storage
    }
    setEditingId(null)
    setEditingItem(null)
    setIsCustomProductSelected(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingItem(null)
    setIsCustomProductSelected(false)
  }

  const deleteItem = (id: string) => {
    const updatedItems = pendingItems.filter((item) => item.id !== id)
    setPendingItems(updatedItems)
    savePendingToLocalStorage(updatedItems)
  }

  const updateEditingItem = (field: keyof PendingItem, value: string | number) => {
    if (editingItem) {
      const updatedItem = { ...editingItem, [field]: value }

      if (field === "product") {
        if (value === "custom") {
          setIsCustomProductSelected(true)
          updatedItem.product = ""
          updatedItem.unitPrice = 0
          updatedItem.unitCost = 0
        } else {
          setIsCustomProductSelected(false)
          const selectedStock = stockItems.find((stock) => stock.name === value)
          if (selectedStock) {
            updatedItem.unitPrice = selectedStock.unitPrice
            updatedItem.unitCost = selectedStock.unitCost
          }
        }
      }
      setEditingItem(updatedItem)
    }
  }

  const handleDownloadPending = () => {
    exportToCsv(pendingItems, "electronics_pending.csv")
  }

  const handleUploadPending = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const csvString = e.target?.result as string
          const expectedHeaders: (keyof PendingItem)[] = [
            "id",
            "date",
            "product",
            "quantitySent",
            "unitPrice",
            "unitCost",
            "status",
          ]
          const importedData = importFromCsv<PendingItem>(csvString, expectedHeaders)
          if (importedData.length > 0) {
            setPendingItems(importedData)
            savePendingToLocalStorage(importedData)
            alert("Pending data uploaded successfully!")
          }
        } catch (error) {
          console.error("Error uploading CSV:", error)
          alert("Failed to upload CSV. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }
  }

  const totalPendingValue = pendingItems.reduce((sum, item) => sum + item.quantitySent * item.unitPrice, 0)
  const totalQuantityPending = pendingItems.reduce((sum, item) => sum + item.quantitySent, 0)
  const pendingCount = pendingItems.filter((item) => item.status === "Pending").length
  const deliveredCount = pendingItems.filter((item) => item.status === "Delivered").length

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "text-orange-600 bg-orange-100"
      case "shipped":
        return "text-blue-600 bg-blue-100"
      case "delivered":
        return "text-green-600 bg-green-100"
      case "cancelled":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Electronics Delivery Tracking</h1>
        <p className="text-gray-600">Track electronics orders awaiting delivery and manage their status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {totalPendingValue.toLocaleString()}</div>
            <p className="text-sm text-orange-100">Pending orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Items Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantityPending}</div>
            <p className="text-sm text-blue-100">Units awaiting</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-sm text-yellow-100">Not yet shipped</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredCount}</div>
            <p className="text-sm text-green-100">Completed orders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Delivery Tracking</CardTitle>
          <div className="flex items-center space-x-4">
            <Button onClick={addNewPending} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Order
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPending}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <Input type="file" accept=".csv" onChange={handleUploadPending} className="hidden" ref={fileInputRef} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity Sent</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input
                          type="date"
                          value={editingItem?.date || ""}
                          onChange={(e) => updateEditingItem("date", e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        item.date
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        isCustomProductSelected ? (
                          <div className="flex flex-col gap-2">
                            <Input
                              value={editingItem?.product || ""}
                              onChange={(e) => updateEditingItem("product", e.target.value)}
                              className="w-full"
                              placeholder="Enter custom product name"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsCustomProductSelected(false)
                                if (editingItem) setEditingItem({ ...editingItem, product: "" })
                              }}
                            >
                              Select from Stock
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={editingItem?.product || ""}
                            onValueChange={(value) => updateEditingItem("product", value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select product from stock" />
                            </SelectTrigger>
                            <SelectContent>
                              {stockItems
                                .filter((stock) => stock.quantity > 0)
                                .map((stock) => (
                                  <SelectItem key={stock.id} value={stock.name}>
                                    {stock.name} (Available: {stock.quantity})
                                  </SelectItem>
                                ))}
                              <SelectItem value="custom">Custom Product</SelectItem>
                            </SelectContent>
                          </Select>
                        )
                      ) : (
                        item.product
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input
                          type="number"
                          value={editingItem?.quantitySent || 0}
                          onChange={(e) => updateEditingItem("quantitySent", Number.parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      ) : (
                        item.quantitySent
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editingItem?.unitPrice || 0}
                          onChange={(e) => updateEditingItem("unitPrice", Number.parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      ) : (
                        `NPR ${item.unitPrice.toLocaleString()}`
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      NPR{" "}
                      {editingId === item.id
                        ? ((editingItem?.quantitySent || 0) * (editingItem?.unitPrice || 0)).toLocaleString()
                        : (item.quantitySent * item.unitPrice).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Select
                          value={editingItem?.status || "Pending"}
                          onValueChange={(value) => updateEditingItem("status", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {editingId === item.id ? (
                          <>
                            <Button size="sm" onClick={saveEdit} className="bg-green-600 hover:bg-green-700">
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => startEditing(item)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pendingItems.length > 0 && (
            <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex justify-between items-center text-lg font-semibold text-orange-800">
                <span>Total Pending Value:</span>
                <span>NPR {totalPendingValue.toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
