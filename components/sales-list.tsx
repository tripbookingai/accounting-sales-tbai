"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Search, TrendingUp, TrendingDown, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Sale, Customer } from "@/lib/types"
import { getProxyUrl } from "@/lib/cdn-client"


interface SalesListProps {
  sales: Sale[]
  customers: Customer[]
  onEdit: (sale: Sale) => void
  onDelete: (id: string) => void
}

export function SalesList({ sales, customers, onEdit, onDelete }: SalesListProps) {

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [productFilter, setProductFilter] = useState("all")
  const [hotelPaymentFilter, setHotelPaymentFilter] = useState("all")
  const router = useRouter()

  const filteredSales = sales.filter((sale: Sale) => {
    const matchesSearch =
      sale.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.booking_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || sale.payment_status === statusFilter
    const matchesProduct = productFilter === "all" || sale.product_type === productFilter
    const matchesHotelPayment =
      hotelPaymentFilter === "all" ||
      (hotelPaymentFilter === "due" && sale.product_type === "Hotel" && !(sale as any).hotel_paid) ||
      (hotelPaymentFilter === "paid" && sale.product_type === "Hotel" && !!(sale as any).hotel_paid)

    return matchesSearch && matchesStatus && matchesProduct && matchesHotelPayment
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800"
      case "Partial":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-red-100 text-red-800"
    }
  }

  const getProductColor = (product: string) => {
    switch (product) {
      case "Air Ticket":
        return "bg-blue-100 text-blue-800"
      case "Hotel":
        return "bg-purple-100 text-purple-800"
      case "Tour Package":
        return "bg-green-100 text-green-800"
      case "Ship Ticket":
        return "bg-teal-100 text-teal-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalRevenue = filteredSales.reduce((sum: number, sale: Sale) => sum + sale.sale_amount, 0)
  const totalProfit = filteredSales.reduce((sum: number, sale: Sale) => sum + sale.profit_loss, 0)
  const averageMargin =
    filteredSales.length > 0
      ? filteredSales.reduce((sum: number, sale: Sale) => sum + sale.profit_margin, 0) / filteredSales.length
      : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Sales Records</CardTitle>
            <CardDescription>Track air tickets, hotels, tour packages, and ship tickets</CardDescription>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold text-primary">
                ৳{totalRevenue.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Profit</p>
              <p
                className={`text-xl font-bold flex items-center justify-center gap-1 ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {totalProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}৳
                {totalProfit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Margin</p>
              <p className={`text-xl font-bold ${averageMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                {averageMargin.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hotel Payments Due</p>
              <p className="text-xl font-bold text-rose-600">{sales.filter(s => s.product_type === "Hotel" && !(s as any).hotel_paid).length}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer phone, name, vendor, or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="Air Ticket">Air Ticket</SelectItem>
              <SelectItem value="Hotel">Hotel</SelectItem>
              <SelectItem value="Tour Package">Tour Package</SelectItem>
              <SelectItem value="Ship Ticket">Ship Ticket</SelectItem>
            </SelectContent>
          </Select>
          <Select value={hotelPaymentFilter} onValueChange={setHotelPaymentFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Hotel Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="due">Hotel Payment Due</SelectItem>
              <SelectItem value="paid">Paid to Hotel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sales Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Transaction Fee</TableHead>
                <TableHead>Net Profit</TableHead>
                <TableHead>Net Margin</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    No sales found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {new Date(sale.transaction_date).toLocaleDateString("en-GB")}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getProductColor(sale.product_type)}`}>{sale.product_type}</Badge>
                      {sale.booking_id && (
                        <div className="text-xs text-muted-foreground mt-1">ID: {sale.booking_id}</div>
                      )}
                      {sale.product_type === "Hotel" && (
                        <div className="text-xs mt-1">
                          {(sale as any).hotel_paid ? (
                            <span className="text-green-600">Paid to hotel</span>
                          ) : (
                            <span className="text-orange-600">Due to hotel</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sale.customer_name}</div>
                        {sale.customer_phone && (
                          <div className="text-xs font-semibold text-blue-600">{sale.customer_phone}</div>
                        )}
                        {sale.customer_email && (
                          <div className="text-xs text-muted-foreground">{sale.customer_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{sale.vendor || "N/A"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {(sale as any).profile_full_name || (sale as any).profile_email || "N/A"}
                      </div>
                      {(sale as any).profile_full_name && (sale as any).profile_email && (
                        <div className="text-xs text-muted-foreground">{(sale as any).profile_email}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      ৳{sale.sale_amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      {sale.outstanding_balance > 0 && (
                        <div className="text-xs text-orange-600">Due: ৳{sale.outstanding_balance.toFixed(2)}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-blue-600">
                        ৳{(sale.transaction_fee_amount ?? 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground">{(sale.transaction_fee_percent ?? 0).toFixed(2)}%</div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${sale.net_profit_loss >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ৳{(sale.net_profit_loss ?? 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${sale.net_profit_margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {(sale.net_profit_margin ?? 0).toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${sale.profit_loss >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ৳{sale.profit_loss.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground">{sale.profit_margin.toFixed(1)}% margin</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getStatusColor(sale.payment_status)}`}>{sale.payment_status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => router.push(`/sales/${sale.id}`)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onEdit(sale)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onDelete(sale.id)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredSales.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredSales.length} of {sales.length} sales
          </div>
        )}
      </CardContent>
    </Card>
  )
}
