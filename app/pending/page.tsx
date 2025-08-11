"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "@/components/ui/select" // Added SelectScrollUpButton, SelectScrollDownButton
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Save, X, Download, Upload } from "lucide-react"
import { useEffect, useState, useRef, useMemo } from "react" // Added useMemo
import { exportToCsv, importFromCsv } from "@/lib/csv"
import { getClientSideSupabase } from "@/lib/supabase-browser"

interface PendingItem {
  id: string
  date: string
  product: string
  quantity_sent: number
  unit_price: number
  unit_cost: number
  status: string
  created_at: string
}

interface StockItem {
  id: string
  name: string
  sku: string
  unit_cost: number
  unit_price: number
  quantity: number
  category: string
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
  created_at: string
}

export default function PendingPage() {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<PendingItem | null>(null)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [salesItems, setSalesItems] = useState<SaleItem[]>([])
  const [isCustomProductSelected, setIsCustomProductSelected] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getClientSideSupabase()

  // State for product search in select dropdown
  const [productSearchQuery, setProductSearchQuery] = useState<string>("")

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      try {
        const { data: pendingData, error: pendingError } = await supabase.from("pending").select("*")
        if (pendingError) throw pendingError
        setPendingItems(pendingData as PendingItem[])

        const { data: stockData, error: stockError } = await supabase.from("stock").select("*")
        if (stockError) throw stockError
        setStockItems(stockData as StockItem[])

        const { data: salesData, error: salesError } = await supabase.from("sales").select("*")
        if (salesError) throw salesError
        setSalesItems(salesData as SaleItem[])
      } catch (error: any) {
        console.error("Error fetching pending page data:", error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [supabase])

  const addNewPending = async () => {
    const today = new Date().toISOString().split("T")[0]
    const newPending: Omit<PendingItem, "id" | "created_at"> = {
      date: today,
      product: "",
      quantity_sent: 1,
      unit_price: 0,
      unit_cost: 0,
      status: "Pending",
    }

    try {
      const { data, error } = await supabase.from("pending").insert([newPending]).select().single()
      if (error) throw error
      setPendingItems((prev) => [...prev, data as PendingItem])
      setEditingId(data.id)
      setEditingItem(data as PendingItem)
      setIsCustomProductSelected(false)
      setProductSearchQuery("") // Reset search query on new item
    } catch (error: any) {
      console.error("Error adding new pending item:", error.message)
      alert("Failed to add new pending item: " + error.message)
    }
  }

  const startEditing = (item: PendingItem) => {
    setEditingId(item.id)
    setEditingItem({ ...item })
    const isProductInStock = stockItems.some((stock) => stock.name === item.product)
    setIsCustomProductSelected(!isProductInStock)
    setProductSearchQuery("") // Reset search query when starting edit
  }

  const saveEdit = async () => {
    if (editingItem) {
      try {
        const updatesPending = {
          date: editingItem.date,
          product: editingItem.product,
          quantity_sent: editingItem.quantity_sent,
          unit_price: editingItem.unit_price,
          unit_cost: editingItem.unit_cost,
          status: editingItem.status,
        }
        const { error: updatePendingError } = await supabase
          .from("pending")
          .update(updatesPending)
          .eq("id", editingItem.id)
        if (updatePendingError) throw updatePendingError

        let updatedPendingItems = pendingItems.map((item) => (item.id === editingItem.id ? editingItem : item))
        let updatedSalesItems = [...salesItems]
        let updatedStockItems = [...stockItems]

        if (editingItem.status === "Delivered" || editingItem.status === "Shipped") {
          const stockItemToUpdate = updatedStockItems.find((stock) => stock.name === editingItem.product)
          if (stockItemToUpdate) {
            const newQuantity = stockItemToUpdate.quantity - editingItem.quantity_sent
            const { error: updateStockError } = await supabase
              .from("stock")
              .update({ quantity: newQuantity })
              .eq("id", stockItemToUpdate.id)
            if (updateStockError) throw updateStockError

            updatedStockItems = updatedStockItems.map((item) =>
              item.id === stockItemToUpdate.id ? { ...item, quantity: newQuantity } : item,
            )
            alert(`Stock quantity for "${editingItem.product}" updated.`)
          } else {
            alert(`Warning: Product "${editingItem.product}" not found in stock to decrement quantity.`)
          }
        }

        if (editingItem.status === "Delivered") {
          const newSale: Omit<SaleItem, "id" | "created_at"> = {
            date: new Date().toISOString().split("T")[0],
            product: editingItem.product,
            quantity_sold: editingItem.quantity_sent,
            unit_price: editingItem.unit_price,
            unit_cost: editingItem.unit_cost,
            total_sale: editingItem.quantity_sent * editingItem.unit_price,
          }
          const { data: insertedSale, error: insertSaleError } = await supabase
            .from("sales")
            .insert([newSale])
            .select()
            .single()
          if (insertSaleError) throw insertSaleError
          updatedSalesItems = [...salesItems, insertedSale as SaleItem]

          const { error: deletePendingError } = await supabase.from("pending").delete().eq("id", editingItem.id)
          if (deletePendingError) throw deletePendingError
          updatedPendingItems = updatedPendingItems.filter((item) => item.id !== editingItem.id)

          alert(`Item "${editingItem.product}" marked as Delivered and moved to Sales!`)
        } else if (editingItem.status === "Cancelled") {
          const { error: deletePendingError } = await supabase.from("pending").delete().eq("id", editingItem.id)
          if (deletePendingError) throw deletePendingError
          updatedPendingItems = updatedPendingItems.filter((item) => item.id !== editingItem.id)
          alert(`Item "${editingItem.product}" has been cancelled and removed from pending.`)
        }

        setPendingItems(updatedPendingItems)
        setSalesItems(updatedSalesItems)
        setStockItems(updatedStockItems)
      } catch (error: any) {
        console.error("Error saving pending item or related updates:", error.message)
        alert("Failed to save changes: " + error.message)
      } finally {
        setEditingId(null)
        setEditingItem(null)
        setIsCustomProductSelected(false)
        setProductSearchQuery("") // Reset search query after saving
      }
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingItem(null)
    setIsCustomProductSelected(false)
    setProductSearchQuery("") // Reset search query on cancel
  }

  const deleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this pending order?")) return

    try {
      const { error } = await supabase.from("pending").delete().eq("id", id)
      if (error) throw error
      setPendingItems((prev) => prev.filter((item) => item.id !== id))
    } catch (error: any) {
      console.error("Error deleting pending item:", error.message)
      alert("Failed to delete pending item: " + error.message)
    }
  }

  const updateEditingItem = (field: keyof PendingItem, value: string | number) => {
    if (editingItem) {
      const updatedItem = { ...editingItem, [field]: value }

      if (field === "product") {
        if (value === "custom") {
          setIsCustomProductSelected(true)
          updatedItem.product = ""
          updatedItem.unit_price = 0
          updatedItem.unit_cost = 0
        } else {
          setIsCustomProductSelected(false)
          const selectedStock = stockItems.find((stock) => stock.name === value)
          if (selectedStock) {
            updatedItem.unit_price = selectedStock.unit_price
            updatedItem.unit_cost = selectedStock.unit_cost
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
      reader.onload = async (e) => {
        try {
          const csvString = e.target?.result as string
          const expectedHeaders: (keyof PendingItem)[] = [
            "id",
            "date",
            "product",
            "quantity_sent",
            "unit_price",
            "unit_cost",
            "status",
          ]
          const importedData = importFromCsv<PendingItem>(csvString, expectedHeaders)
          if (importedData.length > 0) {
            const itemsToUpsert = importedData.map((item) => ({ ...item }))

            const { error } = await supabase.from("pending").upsert(itemsToUpsert, { onConflict: "id" })
            if (error) throw error

            const { data: fetchedData, error: fetchError } = await supabase.from("pending").select("*")
            if (fetchError) throw fetchError
            setPendingItems(fetchedData as PendingItem[])

            alert("Pending data uploaded successfully!")
          }
        } catch (error: any) {
          console.error("Error uploading CSV:", error)
          alert(
            "Failed to upload CSV. Please check the file format and ensure you are logged in. Error: " + error.message,
          )
        }
      }
      reader.readAsText(file)
    }
  }

  const totalPendingValue = pendingItems.reduce((sum, item) => sum + item.quantity_sent * item.unit_price, 0)
  const totalQuantityPending = pendingItems.reduce((sum, item) => sum + item.quantity_sent, 0)
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

  // Filter stock items for the product select dropdown based on search query
  const filteredStockForSelect = useMemo(() => {
    if (!productSearchQuery) {
      return stockItems
    }
    const lowerCaseQuery = productSearchQuery.toLowerCase()
    return stockItems.filter(
      (stock) => stock.name.toLowerCase().includes(lowerCaseQuery) || stock.sku.toLowerCase().includes(lowerCaseQuery),
    )
  }, [stockItems, productSearchQuery])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading pending data...</p>
      </div>
    )
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
                              <div className="p-1">
                                <Input
                                  placeholder="Search products..."
                                  value={productSearchQuery}
                                  onChange={(e) => setProductSearchQuery(e.target.value)}
                                  // Prevent the select from closing when typing in the search input
                                  onKeyDown={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              {filteredStockForSelect.length > 0 ? (
                                <>
                                  <SelectScrollUpButton />
                                  {filteredStockForSelect.map((stock) => (
                                    <SelectItem key={stock.id} value={stock.name}>
                                      {stock.name} (Available: {stock.quantity})
                                      {stock.quantity === 0 && " (Out of Stock)"}
                                    </SelectItem>
                                  ))}
                                  <SelectScrollDownButton />
                                </>
                              ) : (
                                <div className="p-2 text-center text-sm text-muted-foreground">No products found.</div>
                              )}
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
                          value={editingItem?.quantity_sent || 0}
                          onChange={(e) => updateEditingItem("quantity_sent", Number.parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      ) : (
                        item.quantity_sent
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editingItem?.unit_price || 0}
                          onChange={(e) => updateEditingItem("unit_price", Number.parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      ) : (
                        `NPR ${item.unit_price.toLocaleString()}`
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      NPR{" "}
                      {editingId === item.id
                        ? ((editingItem?.quantity_sent || 0) * (editingItem?.unit_price || 0)).toLocaleString()
                        : (item.quantity_sent * item.unit_price).toLocaleString()}
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
