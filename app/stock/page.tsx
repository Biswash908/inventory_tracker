"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Save, X, Settings, Download, Upload } from "lucide-react"
import { useEffect, useState, useMemo, useRef } from "react"
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
import { exportToCsv, importFromCsv } from "@/lib/csv"
import { getClientSideSupabase } from "@/lib/supabase-browser"

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

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All")
  const [categories, setCategories] = useState<string[]>([])
  const [newCategoryName, setNewCategoryName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getClientSideSupabase()

  // State for sorting
  const [currentSortOption, setCurrentSortOption] = useState<string>("name_asc") // Default sort by Product Name (A-Z)

  useEffect(() => {
    const fetchStockItems = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from("stock").select("*")
        if (error) throw error
        setStockItems(data as StockItem[])
      } catch (error: any) {
        console.error("Error fetching stock items:", error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStockItems()

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
  }, [supabase])

  const saveCategoriesToLocalStorage = (cats: string[]) => {
    localStorage.setItem("inventory-categories", JSON.stringify(cats))
  }

  const generateSkuFromName = (name: string): string => {
    if (!name) return ""
    const cleanedName = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
    const uniqueId = Date.now().toString().slice(-4)
    return `${cleanedName}-${uniqueId}`
  }

  const addNewItem = async () => {
    const newItem: Omit<StockItem, "id" | "created_at"> = {
      name: "",
      sku: "",
      unit_cost: 0,
      unit_price: 0,
      quantity: 0,
      category: categories.length > 0 ? categories[0] : "",
    }

    try {
      const { data, error } = await supabase.from("stock").insert([newItem]).select().single()
      if (error) throw error
      setStockItems((prev) => [...prev, data as StockItem])
      setEditingId(data.id)
      setEditingItem(data as StockItem)
    } catch (error: any) {
      console.error("Error adding new item:", error.message)
      alert("Failed to add new item: " + error.message)
    }
  }

  const startEditing = (item: StockItem) => {
    setEditingId(item.id)
    setEditingItem({ ...item })
  }

  const saveEdit = async () => {
    if (editingItem) {
      try {
        const updates = {
          name: editingItem.name,
          sku: editingItem.sku,
          unit_cost: editingItem.unit_cost,
          unit_price: editingItem.unit_price,
          quantity: editingItem.quantity,
          category: editingItem.category,
        }
        const { error } = await supabase.from("stock").update(updates).eq("id", editingItem.id)
        if (error) throw error
        setStockItems((prev) => prev.map((item) => (item.id === editingItem.id ? editingItem : item)))
        setEditingId(null)
        setEditingItem(null)
      } catch (error: any) {
        console.error("Error saving item:", error.message)
        alert("Failed to save item: " + error.message)
      }
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingItem(null)
  }

  const deleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return

    try {
      const { error } = await supabase.from("stock").delete().eq("id", id)
      if (error) throw error
      setStockItems((prev) => prev.filter((item) => item.id !== id))
    } catch (error: any) {
      console.error("Error deleting item:", error.message)
      alert("Failed to delete item: " + error.message)
    }
  }

  const updateEditingItem = (field: keyof StockItem, value: string | number) => {
    if (editingItem) {
      let updatedSku = editingItem.sku
      if (field === "name" && typeof value === "string") {
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

    const updatedStockItems = stockItems.map((item) =>
      item.category === categoryToDelete ? { ...item, category: "" } : item,
    )
    setStockItems(updatedStockItems)
    updatedStockItems.forEach(async (item) => {
      if (item.category === "") {
        await supabase.from("stock").update({ category: "" }).eq("id", item.id)
      }
    })
  }

  const handleDownloadStock = () => {
    exportToCsv(stockItems, "electronics_stock.csv")
  }

  const handleUploadStock = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const csvString = e.target?.result as string
          const expectedHeaders: (keyof StockItem)[] = [
            "id",
            "name",
            "sku",
            "unit_cost",
            "unit_price",
            "quantity",
            "category",
          ]
          const importedData = importFromCsv<StockItem>(csvString, expectedHeaders)
          if (importedData.length > 0) {
            const itemsToUpsert = importedData.map((item) => ({ ...item }))

            const { error } = await supabase.from("stock").upsert(itemsToUpsert, { onConflict: "id" })
            if (error) throw error

            const { data, error: fetchError } = await supabase.from("stock").select("*")
            if (fetchError) throw fetchError
            setStockItems(data as StockItem[])

            alert("Stock data uploaded successfully!")
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

  const totalStockValue = stockItems.reduce((sum, item) => sum + item.unit_cost * item.quantity, 0)
  const totalRetailValue = stockItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const totalItems = stockItems.reduce((sum, item) => sum + item.quantity, 0)

  // Filter stock items based on selected category
  const filteredStockItems = useMemo(() => {
    if (selectedCategoryFilter === "All") {
      return stockItems
    }
    return stockItems.filter((item) => item.category === selectedCategoryFilter)
  }, [stockItems, selectedCategoryFilter])

  // Prepare items for display based on sorting option
  const sortedDisplayItems = useMemo(() => {
    const itemsToSort = [...filteredStockItems]
    const [key, direction] = currentSortOption.split("_")
    const sortDirection = direction as "asc" | "desc"
    const sortKey = key as keyof StockItem | "category"

    if (sortKey === "category") {
      // Group by category, then sort categories, then sort items within category by name
      const grouped: { [key: string]: StockItem[] } = {}
      itemsToSort.forEach((item) => {
        const category = item.category || "Uncategorized"
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(item)
      })

      const sortedCategories = Object.keys(grouped).sort((a, b) => {
        if (sortDirection === "asc") return a.localeCompare(b)
        return b.localeCompare(a)
      })

      const result: { type: "category-header" | "item"; data: string | StockItem }[] = []
      sortedCategories.forEach((category) => {
        result.push({ type: "category-header", data: category })
        // Always sort by name within category for consistency when grouped
        const sortedItems = grouped[category].sort((a, b) => a.name.localeCompare(b.name))
        sortedItems.forEach((item) => result.push({ type: "item", data: item }))
      })
      return result
    } else {
      // Standard flat list sorting by selected key
      itemsToSort.sort((a, b) => {
        const valA: any = a[sortKey]
        const valB: any = b[sortKey]

        // Handle string comparison for 'name', 'sku', 'category'
        if (typeof valA === "string" && typeof valB === "string") {
          return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        // Handle numeric comparison for other fields
        return sortDirection === "asc" ? valA - valB : valB - valA
      })
      return itemsToSort.map((item) => ({ type: "item", data: item }))
    }
  }, [filteredStockItems, currentSortOption])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading stock data...</p>
      </div>
    )
  }

  return (
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

            {/* New Sort By Select */}
            <Select value={currentSortOption} onValueChange={setCurrentSortOption}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Product Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Product Name (Z-A)</SelectItem>
                <SelectItem value="category_asc">Category (A-Z)</SelectItem>
                <SelectItem value="category_desc">Category (Z-A)</SelectItem>
                <SelectItem value="quantity_asc">Quantity (Low to High)</SelectItem>
                <SelectItem value="quantity_desc">Quantity (High to Low)</SelectItem>
                <SelectItem value="unit_cost_asc">Unit Cost (Low to High)</SelectItem>
                <SelectItem value="unit_cost_desc">Unit Cost (High to Low)</SelectItem>
                <SelectItem value="unit_price_asc">Unit Price (Low to High)</SelectItem>
                <SelectItem value="unit_price_desc">Unit Price (High to Low)</SelectItem>
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
                {sortedDisplayItems.map((row, index) => {
                  if (row.type === "category-header") {
                    return (
                      <TableRow key={`category-${row.data}-${index}`} className="bg-gray-50 hover:bg-gray-100">
                        <TableCell colSpan={8} className="font-semibold text-lg py-3">
                          {row.data}
                        </TableCell>
                      </TableRow>
                    )
                  } else {
                    const item = row.data as StockItem
                    return (
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
                              value={editingItem?.unit_cost || ""}
                              onChange={(e) => updateEditingItem("unit_cost", Number.parseFloat(e.target.value) || 0)}
                              className="w-full"
                              placeholder="0"
                            />
                          ) : (
                            `NPR ${item.unit_cost.toLocaleString()}`
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === item.id ? (
                            <Input
                              type="number"
                              value={editingItem?.unit_price || ""}
                              onChange={(e) => updateEditingItem("unit_price", Number.parseFloat(e.target.value) || 0)}
                              className="w-full"
                              placeholder="0"
                            />
                          ) : (
                            `NPR ${item.unit_price.toLocaleString()}`
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
                          NPR {(item.unit_cost * item.quantity).toLocaleString()}
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
                    )
                  }
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
