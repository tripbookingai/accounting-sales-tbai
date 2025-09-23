"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, DollarSign, ShoppingCart } from "lucide-react"

interface VendorAnalysisData {
  totalVendors: number
  totalSpent: number
  averageSpentPerVendor: number
  // Sale Vendors Data
  saleVendors: {
    totalVendors: number
    totalRevenue: number
    averageRevenuePerVendor: number
    topVendors: Array<{
      name: string
      totalAmount: number
      transactionCount: number
      averageTransaction: number
      lastTransaction: string
      category: string
    }>
    vendorsByCategory: Array<{
      category: string
      vendorCount: number
      totalAmount: number
      averageAmount: number
    }>
  }
  // Expense Vendors Data
  expenseVendors: {
    totalVendors: number
    totalSpent: number
    averageSpentPerVendor: number
    topVendors: Array<{
      name: string
      totalAmount: number
      transactionCount: number
      averageTransaction: number
      lastTransaction: string
      category: string
    }>
    vendorsByCategory: Array<{
      category: string
      vendorCount: number
      totalAmount: number
      averageAmount: number
    }>
  }
  topVendors: Array<{
    name: string
    totalAmount: number
    transactionCount: number
    averageTransaction: number
    lastTransaction: string
    category: string
  }>
  vendorsByCategory: Array<{
    category: string
    vendorCount: number
    totalAmount: number
    averageAmount: number
  }>
  paymentAnalysis: Array<{
    vendor: string
    pendingAmount: number
    paidAmount: number
    totalAmount: number
    paymentRatio: number
  }>
  monthlySpending: Array<{
    month: string
    amount: number
    vendorCount: number
    transactions: number
  }>
  vendorPerformance: Array<{
    vendor: string
    reliability: number
    avgResponseTime: number
    qualityRating: number
    costEffectiveness: number
  }>
}

interface VendorAnalysisReportProps {
  data: VendorAnalysisData
  dateRange: string
}

export function VendorAnalysisReport({ data, dateRange }: VendorAnalysisReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      currencyDisplay: 'symbol'
    }).format(amount).replace('BDT', '৳')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Vendor Analysis Report</h2>
        <p className="text-muted-foreground">Period: {dateRange}</p>
      </div>

      {/* Sale Vendors Section */}
      <div className="space-y-4">
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="text-xl font-semibold text-green-700">Sale Vendors</h3>
          <p className="text-sm text-muted-foreground">Vendors involved in sales transactions</p>
        </div>

        {/* Sale Vendors Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sale Vendors</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{data.saleVendors?.totalVendors || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(data.saleVendors?.totalRevenue || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue per Vendor</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(data.saleVendors?.averageRevenuePerVendor || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Sale Vendors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Top Sale Vendors</CardTitle>
            <CardDescription>Vendors with highest sales revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Avg Transaction</TableHead>
                  <TableHead>Last Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.saleVendors?.topVendors || []).map((vendor, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{vendor.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      {formatCurrency(vendor.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">{vendor.transactionCount}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(vendor.averageTransaction)}
                    </TableCell>
                    <TableCell>{new Date(vendor.lastTransaction).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Expense Vendors Section */}
      <div className="space-y-4">
        <div className="border-l-4 border-red-500 pl-4">
          <h3 className="text-xl font-semibold text-red-700">Expense Vendors</h3>
          <p className="text-sm text-muted-foreground">Vendors involved in expense transactions</p>
        </div>

        {/* Expense Vendors Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expense Vendors</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{data.expenseVendors?.totalVendors || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{formatCurrency(data.expenseVendors?.totalSpent || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Spent per Vendor</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{formatCurrency(data.expenseVendors?.averageSpentPerVendor || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Expense Vendors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">Top Expense Vendors</CardTitle>
            <CardDescription>Vendors with highest expense amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Avg Transaction</TableHead>
                  <TableHead>Last Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.expenseVendors?.topVendors || []).map((vendor, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{vendor.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-700">
                      {formatCurrency(vendor.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">{vendor.transactionCount}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(vendor.averageTransaction)}
                    </TableCell>
                    <TableCell>{new Date(vendor.lastTransaction).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Payment Analysis for Expense Vendors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-700">Payment Status Analysis</CardTitle>
          <CardDescription>Outstanding and paid amounts by expense vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Pending Amount</TableHead>
                <TableHead className="text-right">Paid Amount</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Payment Ratio</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.paymentAnalysis || []).map((payment, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{payment.vendor}</TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatCurrency(payment.pendingAmount)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(payment.paidAmount)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(payment.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((payment.paymentRatio || 0) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <Badge className={(payment.paymentRatio || 0) > 0.8 ? "bg-green-100 text-green-800" : (payment.paymentRatio || 0) > 0.5 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                      {(payment.paymentRatio || 0) > 0.8 ? "Good" : (payment.paymentRatio || 0) > 0.5 ? "Fair" : "Poor"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}