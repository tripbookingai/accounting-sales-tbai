"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Hotel } from "lucide-react"

interface SalesReportData {
  sales: any[]
  totalSales: number
  totalCount: number
  productBreakdown: Array<{ product: string; amount: number; count: number }>
  statusBreakdown: Array<{ status: string; amount: number; count: number }>
  topCustomers: Array<{ name: string; amount: number; transactions: number }>
  averageSaleValue: number
  totalProfit: number
  profitMargin: number
  // Hotel-specific data
  totalHotelNights?: number
  hotelNightsByVendor?: Array<{ vendor: string; nights: number; amount: number; bookings: number }>
}

interface SalesReportProps {
  data: SalesReportData
  dateRange: string
  productType?: string
}

export function SalesReport({ data, dateRange, productType }: SalesReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      currencyDisplay: 'symbol'
    }).format(amount).replace('BDT', '৳')
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Sales Report
          {productType && productType !== "all" && (
            <span className="text-lg font-normal text-muted-foreground ml-2">
              - {productType}
            </span>
          )}
        </h2>
        <p className="text-muted-foreground">Period: {dateRange}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalSales || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sale Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.averageSaleValue || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalProfit || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.profitMargin || 0).toFixed(2)}%</div>
          </CardContent>
        </Card>

        {/* Hotel Nights Card - Show only for Hotel reports or All products */}
        {(productType === "Hotel" || productType === "all" || !productType) && data.totalHotelNights !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hotel Nights</CardTitle>
              <Hotel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalHotelNights || 0}</div>
              <p className="text-xs text-muted-foreground">All vendors combined</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.productBreakdown || []).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.product}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold">{formatCurrency(item.amount || 0)}</div>
                    <div className="text-xs text-muted-foreground">{item.count || 0} sales</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.statusBreakdown || []).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  <div className="text-right">
                    <div className="text-sm font-bold">{formatCurrency(item.amount || 0)}</div>
                    <div className="text-xs text-muted-foreground">{item.count || 0} sales</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.topCustomers || []).map((customer, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">{customer.transactions || 0} transactions</div>
                  </div>
                  <div className="text-sm font-bold">{formatCurrency(customer.amount || 0)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hotel Nights by Vendor - Show only when we have hotel data */}
      {(productType === "Hotel" || productType === "all" || !productType) && data.hotelNightsByVendor && data.hotelNightsByVendor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hotel Nights by Vendor</CardTitle>
            <CardDescription>Total nights and revenue breakdown by hotel vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.hotelNightsByVendor.map((vendor, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="text-sm font-medium">{vendor.vendor || 'Unknown Vendor'}</div>
                    <div className="text-xs text-muted-foreground">
                      {vendor.bookings || 0} booking{vendor.bookings !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{vendor.nights || 0} nights</div>
                    <div className="text-sm font-medium">{formatCurrency(vendor.amount || 0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Details</CardTitle>
          <CardDescription>Complete list of sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vendor</TableHead>
                {(productType === "Hotel" || productType === "all" || !productType) && (
                  <>
                    <TableHead>Rooms</TableHead>
                    <TableHead>Total Nights</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.sales || []).map((sale: any) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.transaction_date).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.customer_name}</TableCell>
                  <TableCell>{sale.product_type}</TableCell>
                  <TableCell>{formatCurrency(sale.sale_amount || 0)}</TableCell>
                  <TableCell>{formatCurrency(sale.profit_loss || 0)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(sale.payment_status)}>
                      {sale.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{sale.vendor || '-'}</TableCell>
                  {(productType === "Hotel" || productType === "all" || !productType) && (
                    <>
                      <TableCell>
                        {sale.product_type === "Hotel" && sale.number_of_rooms ? sale.number_of_rooms : '-'}
                      </TableCell>
                      <TableCell>
                        {sale.product_type === "Hotel" && sale.nights ? sale.nights : '-'}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}