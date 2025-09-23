"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Download, FileText } from "lucide-react"

interface ReportFiltersProps {
  onFiltersChange: (filters: ReportFilters) => void
  onGenerateReport: () => void
  onExportReport: (format: "pdf" | "csv") => void
}

export interface ReportFilters {
  reportType: string
  dateRange: string
  startDate: string
  endDate: string
  category: string
  vendor: string
  customer: string
  paymentStatus: string
  approvalStatus: string
  productType: string
}

export function ReportFilters({ onFiltersChange, onGenerateReport, onExportReport }: ReportFiltersProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: "summary",
    dateRange: "this-month",
    startDate: "",
    endDate: "",
    category: "all",
    vendor: "all",
    customer: "all",
    paymentStatus: "all",
    approvalStatus: "all",
    productType: "all",
  })

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const setDateRange = (range: string) => {
    const today = new Date()
    let startDate = ""
    let endDate = today.toISOString().split("T")[0]

    switch (range) {
      case "today":
        startDate = endDate
        break
      case "this-week":
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
        startDate = weekStart.toISOString().split("T")[0]
        break
      case "this-month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
        break
      case "this-quarter":
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
        startDate = quarterStart.toISOString().split("T")[0]
        break
      case "this-year":
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0]
        break
      case "last-month":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        startDate = lastMonth.toISOString().split("T")[0]
        endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0]
        break
    }

    const newFilters = { ...filters, dateRange: range, startDate, endDate }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Report Filters
        </CardTitle>
        <CardDescription>Configure your report parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Report Type */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={filters.reportType} onValueChange={(value) => handleFilterChange("reportType", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Financial Summary</SelectItem>
                <SelectItem value="expenses">Expense Report</SelectItem>
                <SelectItem value="sales">Sales Report</SelectItem>
                <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                <SelectItem value="cash-flow">Cash Flow</SelectItem>
                <SelectItem value="vendor-analysis">Vendor Analysis</SelectItem>
                <SelectItem value="customer-analysis">Customer Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select value={filters.dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="administrative">Administrative & Office</SelectItem>
                <SelectItem value="it">IT & Infrastructure</SelectItem>
                <SelectItem value="hr">HR & Payroll</SelectItem>
                <SelectItem value="marketing">Marketing & Advertising</SelectItem>
                <SelectItem value="travel">Travel & Entertainment</SelectItem>
                <SelectItem value="financial">Financial & Banking</SelectItem>
                <SelectItem value="professional">Professional & Outsourcing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product Type Filter - Show only for sales-related reports */}
          {(filters.reportType === "sales" || filters.reportType === "summary" || filters.reportType === "customer-analysis") && (
            <div className="space-y-2">
              <Label>Product Type</Label>
              <Select value={filters.productType} onValueChange={(value) => handleFilterChange("productType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="Air Ticket">Air Ticket</SelectItem>
                  <SelectItem value="Hotel">Hotel</SelectItem>
                  <SelectItem value="Tour Package">Tour Package</SelectItem>
                  <SelectItem value="Visa">Visa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Additional Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select value={filters.paymentStatus} onValueChange={(value) => handleFilterChange("paymentStatus", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Approval Status</Label>
            <Select
              value={filters.approvalStatus}
              onValueChange={(value) => handleFilterChange("approvalStatus", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-4 border-t">
          <Button onClick={onGenerateReport} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
          <Button variant="outline" onClick={() => onExportReport("pdf")} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => onExportReport("csv")} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
