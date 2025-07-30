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

interface SaleItem {
  id: string
  date: string
  product: string
  quantitySold: number
  unitPrice: number
  unitCost: number
  totalSale: number
}

interface PendingItem {
  id: string
  date: string
  product: string
  quantitySent: number
  unitPrice: number
  unitCost: number
  status: string
}

export default function SalesPage() {
  const [salesItems, setSalesItems] = useState<SaleItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<SaleItem | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [isCustomProductSelected, setIsCustomProductSelected] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedSales = localStorage.getItem("inventory-sales")
    const savedPending = localStorage.getItem("inventory-pending")

    if (savedPending) {
      setPendingItems(JSON.parse(savedPending))
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

  const saveToLocalStorage = (items: SaleItem[]) => {
    localStorage.setItem("inventory-sales", JSON.stringify(items))
  }

  const addNewSale = () => {
    const today = new Date().toISOString().split("T")[0]
    const newSale: SaleItem = {
      id: Date.now().toString(),
      date: today,
      product: "",
      quantitySold: 1,
      unitPrice: 0,
      unitCost: 0,
      totalSale: 0,
    }
    const updatedItems = [...salesItems, newSale]
    setSalesItems(updatedItems)
    saveToLocalStorage(updatedItems)
    setEditingId(newSale.id)
    setEditingItem(newSale)
    setIsCustomProductSelected(false)
  }

  const startEditing = (item: SaleItem) => {
    setEditingId(item.id)
    setEditingItem({ ...item })
    const isProductInPending = pendingItems.some((pending) => pending.product === item.product)
    setIsCustomProductSelected(!isProductInPending)
  }

  const saveEdit = () => {
    if (editingItem) {
      const updatedItem = {
        ...editingItem,
        totalSale: editingItem.quantitySold * editingItem.unitPrice,
      }
      const updatedItems = salesItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      setSalesItems(updatedItems)
      saveToLocalStorage(updatedItems)
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
    const updatedItems = salesItems.filter((item) => item.id !== id)
    setSalesItems(updatedItems)
    saveToLocalStorage(updatedItems)
  }

  const updateEditingItem = (field: keyof SaleItem, value: string | number) => {
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
          const selectedPending = pendingItems.find((pending) => pending.product === value)
          if (selectedPending) {
            updatedItem.unitPrice = selectedPending.unitPrice
            updatedItem.unitCost = selectedPending.unitCost
          }
        }
      }

      if (field === "quantitySold" || field === "unitPrice") {
        updatedItem.totalSale = updatedItem.quantitySold * updatedItem.unitPrice
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
      reader.onload = (e) => {
        try {
          const csvString = e.target?.result as string
          const expectedHeaders: (keyof SaleItem)[] = [
            "id",
            "date",
            "product",
            "quantitySold",
            "unitPrice",
            "unitCost",
            "totalSale",
          ]
          const importedData = importFromCsv<SaleItem>(csvString, expectedHeaders)
          if (importedData.length > 0) {
            setSalesItems(importedData)
            saveToLocalStorage(importedData)
            alert("Sales data uploaded successfully!")
          }
        } catch (error) {
          console.error("Error uploading CSV:", error)
          alert("Failed to upload CSV. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }
  }

  const totalSalesValue = salesItems.reduce((sum, item) => sum + item.totalSale, 0)
  const totalQuantitySold = salesItems.reduce((sum, item) => sum + item.quantitySold, 0)
  const averageSaleValue = salesItems.length > 0 ? totalSalesValue / salesItems.length : 0

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
                                .filter((pending) => pending.status !== "Delivered" && pending.quantitySent > 0)
                                .map((pending) => (
                                  <SelectItem key={pending.id} value={pending.product}>
                                    {pending.product} (Qty: {pending.quantitySent})
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
                          value={editingItem?.quantitySold || 0}
                          onChange={(e) => updateEditingItem("quantitySold", Number.parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      ) : (
                        item.quantitySold
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
                    <TableCell className="font-medium text-green-600">
                      NPR{" "}
                      {editingId === item.id
                        ? (editingItem?.totalSale || 0).toLocaleString()
                        : item.totalSale.toLocaleString()}
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
