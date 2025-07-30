"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Save, X, Download, Upload } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportToCsv, importFromCsv } from "@/lib/csv"
import { getClientSideSupabase } from "@/lib/supabase-browser"

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

export default function SalesPage() {
  const [salesItems, setSalesItems] = useState<SaleItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<SaleItem | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [isCustomProductSelected, setIsCustomProductSelected] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getClientSideSupabase()

  useEffect(() => {
    const fetchSalesAndPending = async () => {
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
        const { data: salesData, error: salesError } = await supabase.from("sales").select("*")
        if (salesError) throw salesError
        setSalesItems(salesData as SaleItem[])

        // Removed .eq("user_id", userId) filter
        const { data: pendingData, error: pendingError } = await supabase.from("pending").select("*")
        if (pendingError) throw pendingError
        setPendingItems(pendingData as PendingItem[])
      } catch (error: any) {
        console.error("Error fetching sales/pending data:", error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSalesAndPending()
  }, [supabase])

  const addNewSale = async () => {
    // No need to fetch user_id for insertion anymore
    // const { data: userData, error: userError } = await supabase.auth.getUser()
    // if (userError || !userData?.user) {
    //   console.error("Error getting user for new sale:", userError?.message)
    //   return
    // }
    // const userId = userData.user.id // Removed

    const today = new Date().toISOString().split("T")[0]
    const newSale: Omit<SaleItem, "id" | "created_at"> = {
      date: today,
      product: "",
      quantity_sold: 1,
      unit_price: 0,
      unit_cost: 0,
      total_sale: 0,
      // user_id: userId, // Removed
    }

    try {
      const { data, error } = await supabase.from("sales").insert([newSale]).select().single()
      if (error) throw error
      setSalesItems((prev) => [...prev, data as SaleItem])
      setEditingId(data.id)
      setEditingItem(data as SaleItem)
      setIsCustomProductSelected(false)
    } catch (error: any) {
      console.error("Error adding new sale:", error.message)
      alert("Failed to add new sale: " + error.message)
    }
  }

  const startEditing = (item: SaleItem) => {
    setEditingId(item.id)
    setEditingItem({ ...item })
    const isProductInPending = pendingItems.some((pending) => pending.product === item.product)
    setIsCustomProductSelected(!isProductInPending)
  }

  const saveEdit = async () => {
    if (editingItem) {
      const updatedItem = {
        ...editingItem,
        total_sale: editingItem.quantity_sold * editingItem.unit_price,
      }
      try {
        const updates = {
          date: updatedItem.date,
          product: updatedItem.product,
          quantity_sold: updatedItem.quantity_sold,
          unit_price: updatedItem.unit_price,
          unit_cost: updatedItem.unit_cost,
          total_sale: updatedItem.total_sale,
        }
        const { error } = await supabase.from("sales").update(updates).eq("id", updatedItem.id)
        if (error) throw error
        setSalesItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
        setEditingId(null)
        setEditingItem(null)
        setIsCustomProductSelected(false)
      } catch (error: any) {
        console.error("Error saving sale:", error.message)
        alert("Failed to save sale: " + error.message)
      }
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingItem(null)
    setIsCustomProductSelected(false)
  }

  const deleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this sale record?")) return

    try {
      const { error } = await supabase.from("sales").delete().eq("id", id)
      if (error) throw error
      setSalesItems((prev) => prev.filter((item) => item.id !== id))
    } catch (error: any) {
      console.error("Error deleting sale:", error.message)
      alert("Failed to delete sale: " + error.message)
    }
  }

  const updateEditingItem = (field: keyof SaleItem, value: string | number) => {
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
          const selectedPending = pendingItems.find((pending) => pending.product === value)
          if (selectedPending) {
            updatedItem.unit_price = selectedPending.unit_price
            updatedItem.unit_cost = selectedPending.unit_cost
          }
        }
      }

      if (field === "quantity_sold" || field === "unit_price") {
        updatedItem.total_sale = updatedItem.quantity_sold * updatedItem.unit_price
      }
      setEditingItem(updatedItem)
    }
  }

  const handleDownloadSales = () => {
    exportToCsv(salesItems, "electronics_sales.csv")
  }

  const handleUploadSales = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const csvString = e.target?.result as string
          const expectedHeaders: (keyof SaleItem)[] = [
            "id",
            "date",
            "product",
            "quantity_sold",
            "unit_price",
            "unit_cost",
            "total_sale",
          ]
          const importedData = importFromCsv<SaleItem>(csvString, expectedHeaders)
          if (importedData.length > 0) {
            // No need to fetch user_id for upload anymore
            // const { data: userData, error: userError } = await supabase.auth.getUser()
            // if (userError || !userData?.user) {
            //   console.error("Error getting user for upload:", userError?.message)
            //   alert("Failed to upload: User not authenticated.")
            //   return
            // }
            // const userId = userData.user.id // Removed

            // Removed user_id from itemsToUpsert
            const itemsToUpsert = importedData.map((item) => ({ ...item }))

            const { error } = await supabase.from("sales").upsert(itemsToUpsert, { onConflict: "id" })
            if (error) throw error

            // Removed .eq("user_id", userId) filter
            const { data, error: fetchError } = await supabase.from("sales").select("*")
            if (fetchError) throw fetchError
            setSalesItems(data as SaleItem[])

            alert("Sales data uploaded successfully!")
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

  const totalSalesValue = salesItems.reduce((sum, item) => sum + item.total_sale, 0)
  const totalQuantitySold = salesItems.reduce((sum, item) => sum + item.quantity_sold, 0)
  const averageSaleValue = salesItems.length > 0 ? totalSalesValue / salesItems.length : 0

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading sales data...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Electronics Sales Tracking</h1>
        <p className="text-gray-600">Record and monitor your electronics sales transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {totalSalesValue.toLocaleString()}</div>
            <p className="text-sm text-green-100">Revenue generated</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Items Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantitySold}</div>
            <p className="text-sm text-blue-100">Units sold</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Average Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {averageSaleValue.toLocaleString()}</div>
            <p className="text-sm text-purple-100">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales Records</CardTitle>
          <div className="flex items-center space-x-4">
            <Button onClick={addNewSale} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Sale
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadSales}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <Input type="file" accept=".csv" onChange={handleUploadSales} className="hidden" ref={fileInputRef} />
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
                  <TableHead>Quantity Sold</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Sale</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesItems.map((item) => (
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
                              Select from Pending
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={editingItem?.product || ""}
                            onValueChange={(value) => updateEditingItem("product", value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select product from pending" />
                            </SelectTrigger>
                            <SelectContent>
                              {pendingItems
                                .filter((pending) => pending.status !== "Delivered" && pending.quantity_sent > 0)
                                .map((pending) => (
                                  <SelectItem key={pending.id} value={pending.product}>
                                    {pending.product} (Qty: {pending.quantity_sent})
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
                          value={editingItem?.quantity_sold || 0}
                          onChange={(e) => updateEditingItem("quantity_sold", Number.parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      ) : (
                        item.quantity_sold
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
                    <TableCell className="font-medium text-green-600">
                      NPR{" "}
                      {editingId === item.id
                        ? (editingItem?.total_sale || 0).toLocaleString()
                        : item.total_sale.toLocaleString()}
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

          {salesItems.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center text-lg font-semibold text-green-800">
                <span>Total Sales Revenue:</span>
                <span>NPR {totalSalesValue.toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
