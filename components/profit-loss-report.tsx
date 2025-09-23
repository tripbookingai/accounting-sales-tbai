"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, DollarSign, Minus } from "lucide-react"

interface ProfitLossData {
  totalRevenue: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  revenueByProduct: Array<{ product: string; amount: number }>
  expensesByCategory: Array<{ category: string; amount: number }>
  monthlyComparison: Array<{ month: string; revenue: number; expenses: number; profit: number }>
}

interface ProfitLossReportProps {
  data: ProfitLossData
  dateRange: string
}

export function ProfitLossReport({ data, dateRange }: ProfitLossReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      currencyDisplay: 'symbol'
    }).format(amount).replace('BDT', '৳')
  }

  const getChangeIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getChangeColor = (value: number) => {
    if (value > 0) return "text-green-600"
    if (value < 0) return "text-red-600"
    return "text-gray-600"
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profit & Loss Statement</h2>
        <p className="text-muted-foreground">Period: {dateRange}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            {getChangeIcon(data.grossProfit)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getChangeColor(data.grossProfit)}`}>
              {formatCurrency(data.grossProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            {getChangeIcon(data.profitMargin)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getChangeColor(data.profitMargin)}`}>
              {(data.profitMargin || 0).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* P&L Statement */}
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Statement</CardTitle>
          <CardDescription>Detailed breakdown of income and expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Item</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Revenue Section */}
              <TableRow className="bg-green-50">
                <TableCell className="font-semibold">REVENUE</TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {formatCurrency(data.totalRevenue)}
                </TableCell>
              </TableRow>
              {(data.revenueByProduct || []).map((item, index) => (
                <TableRow key={`revenue-${index}`}>
                  <TableCell className="pl-8">{item.product}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
              
              {/* Expenses Section */}
              <TableRow className="bg-red-50">
                <TableCell className="font-semibold">EXPENSES</TableCell>
                <TableCell className="text-right font-semibold text-red-600">
                  {formatCurrency(data.totalExpenses)}
                </TableCell>
              </TableRow>
              {(data.expensesByCategory || []).map((item, index) => (
                <TableRow key={`expense-${index}`}>
                  <TableCell className="pl-8">{item.category}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
              
              {/* Profit Section */}
              <TableRow className="border-t-2 border-gray-300">
                <TableCell className="font-bold">GROSS PROFIT</TableCell>
                <TableCell className={`text-right font-bold ${getChangeColor(data.grossProfit)}`}>
                  {formatCurrency(data.grossProfit)}
                </TableCell>
              </TableRow>
              
              <TableRow className="border-t-2 border-gray-300">
                <TableCell className="font-bold">NET PROFIT</TableCell>
                <TableCell className={`text-right font-bold ${getChangeColor(data.netProfit)}`}>
                  {formatCurrency(data.netProfit)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Comparison */}
      {data.monthlyComparison && data.monthlyComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
            <CardDescription>Revenue, expenses, and profit trends by month</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.monthlyComparison || []).map((month, index) => {
                  const margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(month.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(month.expenses)}
                      </TableCell>
                      <TableCell className={`text-right ${getChangeColor(month.profit)}`}>
                        {formatCurrency(month.profit)}
                      </TableCell>
                      <TableCell className={`text-right ${getChangeColor(margin)}`}>
                        {margin.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Performance Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Revenue</span>
                <span className="font-semibold">{formatCurrency(data.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Gross Profit</span>
                <span className="font-semibold">{formatCurrency(data.grossProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Profit Margin</span>
                <span className="font-semibold">{(data.profitMargin || 0).toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Expenses</span>
                <span className="font-semibold">{formatCurrency(data.totalExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Expense Ratio</span>
                <span className="font-semibold">
                  {data.totalRevenue > 0 ? ((data.totalExpenses / data.totalRevenue) * 100).toFixed(2) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profitability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Gross Profit</span>
                <span className={`font-semibold ${getChangeColor(data.grossProfit)}`}>
                  {formatCurrency(data.grossProfit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Net Profit</span>
                <span className={`font-semibold ${getChangeColor(data.netProfit)}`}>
                  {formatCurrency(data.netProfit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}