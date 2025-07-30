"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Save, X, Package } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface PendingItem {
  id: string
  date: string
  product: string
  quantitySent: number
  unitPrice: number
  status: string
}

export default function PendingPage() {
  const [pendingItems, set_pendingItems] = useState<PendingItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<PendingItem | null>(null)

  useEffect(() => {
    const savedPending = localStorage.getItem("inventory-pending")
    if (savedPending) {
      set_pendingItems(JSON.parse(savedPending))
    } else {
      const defaultPending = [
        { id: "1", date: "2025-07-30", product: "iPhone 13", quantitySent: 1, unitPrice: 110000, status: "Pending" },
        {
          id: "2",
          date: "2025-07-29",
          product: "MacBook Air M2",
          quantitySent: 1,
          unitPrice: 145000,
          status: "Shipped",
        },
      ]
      set_pendingItems(defaultPending)
      localStorage.setItem("inventory-pending", JSON.stringify(defaultPending))
    }
  }, [])

  const saveToLocalStorage = (items: PendingItem[]) => {
    localStorage.setItem("inventory-pending", JSON.stringify(items))
  }

  const addNewPending = () => {
    const today = new Date().toISOString().split("T")[0]
    const newPending: PendingItem = {
      id: Date.now().toString(),
      date: today,
      product: "Electronics Item",
      quantitySent: 1,
      unitPrice: 0,
      status: "Pending",
    }
    const updatedItems = [...pendingItems, newPending]
    set_pendingItems(updatedItems)
    saveToLocalStorage(updatedItems)
    setEditingId(newPending.id)
    setEditingItem(newPending)
  }

  const startEditing = (item: PendingItem) => {
    setEditingId(item.id)
    setEditingItem({ ...item })
  }

  const saveEdit = () => {
    if (editingItem) {
      const updatedItems = pendingItems.map((item) => (item.id === editingItem.id ? editingItem : item))
      set_pendingItems(updatedItems)
      saveToLocalStorage(updatedItems)
    }
    setEditingId(null)
    setEditingItem(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingItem(null)
  }

  const deleteItem = (id: string) => {
    const updatedItems = pendingItems.filter((item) => item.id !== id)
    set_pendingItems(updatedItems)
    saveToLocalStorage(updatedItems)
  }

  const updateEditingItem = (field: keyof PendingItem, value: string | number) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, [field]: value })
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-indigo-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">Inventory Dashboard</span>
            </div>
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-gray-500 hover:text-gray-700 font-medium">
                Home
              </Link>
              <Link href="/stock" className="text-gray-500 hover:text-gray-700 font-medium">
                Stock
              </Link>
              <Link href="/sales" className="text-gray-500 hover:text-gray-700 font-medium">
                Sales
              </Link>
              <Link href="/pending" className="text-indigo-600 font-medium border-b-2 border-indigo-600 pb-1">
                Pending
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
            <Button onClick={addNewPending} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Order
            </Button>
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
                          <Input
                            value={editingItem?.product || ""}
                            onChange={(e) => updateEditingItem("product", e.target.value)}
                            className="w-full"
                          />
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
                        NPR
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
    </div>
  )
}
