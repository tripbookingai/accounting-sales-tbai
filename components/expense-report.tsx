"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Receipt, Calendar, DollarSign } from "lucide-react"

interface ExpenseReportData {
  expenses: Array<{
    id: string
    date: string
    vendor: string | null
    category: string
    amount: number
    approval_status: string
    paid_through: string
    reference_number: string | null
    notes: string | null
  }>
  totalAmount: number
  totalCount: number
  categoryBreakdown: Array<{ category: string; amount: number; count: number }>
  statusBreakdown: Array<{ status: string; amount: number; count: number }>
}

interface ExpenseReportProps {
  data: ExpenseReportData
  dateRange: string
}

export function ExpenseReport({ data, dateRange }: ExpenseReportProps) {
  const formatCurrency = (amount: number | undefined | null) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '৳0.00'
    return `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}`
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Paid":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Expense Report
          </CardTitle>
          <CardDescription>Detailed expense analysis for {dateRange}</CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(data.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">{data.totalCount} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalCount > 0 ? data.totalAmount / data.totalCount : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.categoryBreakdown?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Expense categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>Breakdown of expenses across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(data.categoryBreakdown || []).map((category) => (
              <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{category.category}</div>
                  <div className="text-sm text-muted-foreground">{category.count} transactions</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(category.amount)}</div>
                  <div className="text-sm text-muted-foreground">
                    {(((category.amount || 0) / (data.totalAmount || 1)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Status</CardTitle>
          <CardDescription>Approval and payment status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(data.statusBreakdown || []).map((status) => (
              <div key={status.status} className="p-4 border rounded-lg text-center">
                <Badge className={`mb-2 ${getStatusColor(status.status)}`}>{status.status}</Badge>
                <div className="font-bold text-lg">{formatCurrency(status.amount)}</div>
                <div className="text-sm text-muted-foreground">{status.count} expenses</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Expense List */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>Complete list of expenses in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.expenses || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No expenses found for the selected criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  (data.expenses || []).map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {new Date(expense.date).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell>{expense.vendor || "N/A"}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getStatusColor(expense.approval_status)}`}>
                          {expense.approval_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {expense.paid_through}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{expense.reference_number || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
