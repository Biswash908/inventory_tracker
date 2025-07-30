"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Save, X, Settings, Download, Upload } from "lucide-react" // Added Download, Upload icons
import { useEffect, useState, useMemo, useRef } from "react" // Added useRef
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { exportToCsv, importFromCsv } from "@/lib/csv" // Import CSV utilities

interface StockItem {
  id: string
  name: string
  sku: string
  unitCost: number
  unitPrice: number
  quantity: number
  category: string
}

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All")
  const [categories, setCategories] = useState<string[]>([])
  const [newCategoryName, setNewCategoryName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref for file input

  useEffect(() => {
    // Load stock items
    const savedStock = localStorage.getItem("inventory-stock")
    if (savedStock) {
      setStockItems(JSON.parse(savedStock))
    } else {
      const defaultStock = [
        {
          id: "1",
          name: "Samsung Galaxy A54",
          sku: "SGH-A54",
          unitCost: 45000,
          unitPrice: 52000,
          quantity: 25,
          category: "Smartphones",
        },
        {
          id: "2",
          name: "iPhone 13",
          sku: "APL-IP13",
          unitCost: 95000,
          unitPrice: 110000,
          quantity: 15,
          category: "Smartphones",
        },
        {
          id: "3",
          name: "Sony WH-1000XM4",
          sku: "SNY-WH4",
          unitCost: 28000,
          unitPrice: 35000,
          quantity: 40,
          category: "Headphones",
        },
        {
          id: "4",
          name: "MacBook Air M2",
          sku: "APL-MBA2",
          unitCost: 125000,
          unitPrice: 145000,
          quantity: 8,
          category: "Laptops",
        },
        {
          id: "5",
          name: "Logitech MX Master 3S",
          sku: "LOG-MXM3S",
          unitCost: 8000,
          unitPrice: 10000,
          quantity: 30,
          category: "Mouse",
        },
        {
          id: "6",
          name: "HyperX Alloy Origins",
          sku: "HYP-AO",
          unitCost: 12000,
          unitPrice: 15000,
          quantity: 20,
          category: "Keyboards",
        },
        {
          id: "7",
          name: "Xbox Wireless Controller",
          sku: "XBX-WC",
          unitCost: 7000,
          unitPrice: 9000,
          quantity: 18,
          category: "Controllers",
        },
      ]
      setStockItems(defaultStock)
      localStorage.setItem("inventory-stock", JSON.stringify(defaultStock))
    }

    // Load categories
    const savedCategories = localStorage.getItem("inventory-categories")
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories))
    } else {
      const defaultCategories = [
        "Smartphones",
        "Headphones",
        "Laptops",
        "Mouse",
        "Keyboards",
        "Controllers",
        "Monitors",
        "Webcams",
      ]
      setCategories(defaultCategories)
      localStorage.setItem("inventory-categories", JSON.stringify(defaultCategories))
    }
  }, [])

  const saveStockToLocalStorage = (items: StockItem[]) => {
    localStorage.setItem("inventory-stock", JSON.stringify(items))
  }

  const saveCategoriesToLocalStorage = (cats: string[]) => {
    localStorage.setItem("inventory-categories", JSON.stringify(cats))
  }

  // Function to generate SKU from product name
  const generateSkuFromName = (name: string): string => {
    if (!name) return ""
    const cleanedName = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
    const uniqueId = Date.now().toString().slice(-4) // Last 4 digits of timestamp for uniqueness
    return `${cleanedName}-${uniqueId}`
  }

  const addNewItem = () => {
    const newItem: StockItem = {
      id: Date.now().toString(),
      name: "",
      sku: "", // SKU will be generated when name is typed
      unitCost: 0,
      unitPrice: 0,
      quantity: 0,
      category: categories.length > 0 ? categories[0] : "", // Default to first category or empty
    }
    const updatedItems = [...stockItems, newItem]
    setStockItems(updatedItems)
    saveStockToLocalStorage(updatedItems)
    setEditingId(newItem.id)
    setEditingItem(newItem)
  }

  const startEditing = (item: StockItem) => {
    setEditingId(item.id)
    setEditingItem({ ...item })
  }

  const saveEdit = () => {
    if (editingItem) {
      const updatedItems = stockItems.map((item) => (item.id === editingItem.id ? editingItem : item))
      setStockItems(updatedItems)
      saveStockToLocalStorage(updatedItems)
    }
    setEditingId(null)
    setEditingItem(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingItem(null)
  }

  const deleteItem = (id: string) => {
    const updatedItems = stockItems.filter((item) => item.id !== id)
    setStockItems(updatedItems)
    saveStockToLocalStorage(updatedItems)
  }

  const updateEditingItem = (field: keyof StockItem, value: string | number) => {
    if (editingItem) {
      let updatedSku = editingItem.sku
      if (field === "name" && typeof value === "string") {
        // Only auto-generate SKU if it's a new item or SKU is empty
        if (!editingItem.sku || editingItem.name === "") {
          updatedSku = generateSkuFromName(value)
        }
      }
      setEditingItem({ ...editingItem, [field]: value, sku: updatedSku })
    }
  }

  const handleAddCategory = () => {
    if (newCategoryName.trim() !== "" && !categories.includes(newCategoryName.trim())) {
      const updatedCategories = [...categories, newCategoryName.trim()].sort()
      setCategories(updatedCategories)
      saveCategoriesToLocalStorage(updatedCategories)
      setNewCategoryName("")
    }
  }

  const handleDeleteCategory = (categoryToDelete: string) => {
    const updatedCategories = categories.filter((cat) => cat !== categoryToDelete)
    setCategories(updatedCategories)
    saveCategoriesToLocalStorage(updatedCategories)

    // Also update any stock items that used this category to an empty string or default
    const updatedStockItems = stockItems.map((item) =>
      item.category === categoryToDelete ? { ...item, category: "" } : item,
    )
    setStockItems(updatedStockItems)
    saveStockToLocalStorage(updatedStockItems)
  }

  const handleDownloadStock = () => {
    exportToCsv(stockItems, "electronics_stock.csv")
  }

  const handleUploadStock = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const csvString = e.target?.result as string
          const expectedHeaders: (keyof StockItem)[] = [
            "id",
            "name",
            "sku",
            "unitCost",
            "unitPrice",
            "quantity",
            "category",
          ]
          const importedData = importFromCsv<StockItem>(csvString, expectedHeaders)
          if (importedData.length > 0) {
            setStockItems(importedData)
            saveStockToLocalStorage(importedData)
            alert("Stock data uploaded successfully!")
          }
        } catch (error) {
          console.error("Error uploading CSV:", error)
          alert("Failed to upload CSV. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }
  }

  const totalStockValue = stockItems.reduce((sum, item) => sum + item.unitCost * item.quantity, 0)
  const totalRetailValue = stockItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const totalItems = stockItems.reduce((sum, item) => sum + item.quantity, 0)

  // Filtered items based on selected category
  const filteredStockItems = useMemo(() => {
    if (selectedCategoryFilter === "All") {
      return stockItems
    }
    return stockItems.filter((item) => item.category === selectedCategoryFilter)
  }, [stockItems, selectedCategoryFilter])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Electronics Stock Management</h1>
          <p className="text-gray-600">Manage your electronics inventory and track stock levels</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Cost of Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">NPR {totalStockValue.toLocaleString()}</div>
              <p className="text-sm text-blue-100">Total purchase cost of items in stock</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Potential Sales Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">NPR {totalRetailValue.toLocaleString()}</div>
              <p className="text-sm text-green-100">Total selling price of items in stock</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-sm text-purple-100">Units in stock</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Stock Inventory</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Categories
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Manage Product Categories</DialogTitle>
                    <DialogDescription>Add or remove categories for your stock items.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="newCategory" className="text-right">
                        New Category
                      </Label>
                      <Input
                        id="newCategory"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., Monitors"
                      />
                    </div>
                    <Button onClick={handleAddCategory} disabled={newCategoryName.trim() === ""}>
                      Add Category
                    </Button>
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium">Existing Categories:</h4>
                      <div className="flex flex-wrap gap-2">
                        {categories.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No categories defined yet.</p>
                        ) : (
                          categories.map((category) => (
                            <div
                              key={category}
                              className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
                            >
                              <span>{category}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-gray-500 hover:text-red-500"
                                onClick={() => handleDeleteCategory(category)}
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove {category}</span>
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={() => {}}>
                      Done
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button onClick={addNewItem} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadStock}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
              <Input type="file" accept=".csv" onChange={handleUploadStock} className="hidden" ref={fileInputRef} />
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
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Stock Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {editingId === item.id ? (
                          <Input
                            value={editingItem?.name || ""}
                            onChange={(e) => updateEditingItem("name", e.target.value)}
                            className="w-full"
                            placeholder="Enter product name (e.g., iPhone 15, Samsung TV)"
                          />
                        ) : (
                          item.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <Select
                            value={editingItem?.category || ""}
                            onValueChange={(value) => updateEditingItem("category", value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          item.category || "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <Input
                            value={editingItem?.sku || ""}
                            onChange={(e) => updateEditingItem("sku", e.target.value)}
                            className="w-full"
                            placeholder="Auto-generated from name"
                          />
                        ) : (
                          item.sku
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={editingItem?.unitCost || ""}
                            onChange={(e) => updateEditingItem("unitCost", Number.parseFloat(e.target.value) || 0)}
                            className="w-full"
                            placeholder="0"
                          />
                        ) : (
                          `NPR ${item.unitCost.toLocaleString()}`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={editingItem?.unitPrice || ""}
                            onChange={(e) => updateEditingItem("unitPrice", Number.parseFloat(e.target.value) || 0)}
                            className="w-full"
                            placeholder="0"
                          />
                        ) : (
                          `NPR ${item.unitPrice.toLocaleString()}`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={editingItem?.quantity || ""}
                            onChange={(e) => updateEditingItem("quantity", Number.parseInt(e.target.value) || 0)}
                            className="w-full"
                            placeholder="0"
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        NPR {(item.unitCost * item.quantity).toLocaleString()}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
