"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, ArrowRight, DollarSign } from "lucide-react"

interface CashFlowData {
  openingBalance: number
  closingBalance: number
  totalInflow: number
  totalOutflow: number
  netCashFlow: number
  cashInflows: Array<{ source: string; amount: number }>
  cashOutflows: Array<{ category: string; amount: number }>
  monthlyFlow: Array<{ 
    month: string
    inflow: number
    outflow: number
    netFlow: number
    runningBalance: number
  }>
  operatingActivities: number
  investingActivities: number
  financingActivities: number
}

interface CashFlowReportProps {
  data: CashFlowData
  dateRange: string
}

export function CashFlowReport({ data, dateRange }: CashFlowReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      currencyDisplay: 'symbol'
    }).format(amount).replace('BDT', '৳')
  }

  const getFlowColor = (amount: number) => {
    if (amount > 0) return "text-green-600"
    if (amount < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getFlowIcon = (amount: number) => {
    if (amount > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (amount < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Cash Flow Statement</h2>
        <p className="text-muted-foreground">Period: {dateRange}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.openingBalance)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Inflow</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalInflow)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Outflow</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(data.totalOutflow)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            {getFlowIcon(data.netCashFlow)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getFlowColor(data.netCashFlow)}`}>
              {formatCurrency(data.netCashFlow)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.closingBalance)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Statement */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Statement</CardTitle>
          <CardDescription>Detailed cash flow analysis</CardDescription>
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
              {/* Opening Balance */}
              <TableRow className="bg-blue-50">
                <TableCell className="font-semibold">OPENING CASH BALANCE</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(data.openingBalance)}
                </TableCell>
              </TableRow>

              {/* Cash Inflows */}
              <TableRow className="bg-green-50">
                <TableCell className="font-semibold">CASH INFLOWS</TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {formatCurrency(data.totalInflow)}
                </TableCell>
              </TableRow>
              {(data.cashInflows || []).map((item, index) => (
                <TableRow key={`inflow-${index}`}>
                  <TableCell className="pl-8">{item.source}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}

              {/* Cash Outflows */}
              <TableRow className="bg-red-50">
                <TableCell className="font-semibold">CASH OUTFLOWS</TableCell>
                <TableCell className="text-right font-semibold text-red-600">
                  {formatCurrency(data.totalOutflow)}
                </TableCell>
              </TableRow>
              {(data.cashOutflows || []).map((item, index) => (
                <TableRow key={`outflow-${index}`}>
                  <TableCell className="pl-8">{item.category}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}

              {/* Net Cash Flow */}
              <TableRow className="border-t-2 border-gray-300">
                <TableCell className="font-bold">NET CASH FLOW</TableCell>
                <TableCell className={`text-right font-bold ${getFlowColor(data.netCashFlow)}`}>
                  {formatCurrency(data.netCashFlow)}
                </TableCell>
              </TableRow>

              {/* Closing Balance */}
              <TableRow className="border-t-2 border-gray-300 bg-blue-50">
                <TableCell className="font-bold">CLOSING CASH BALANCE</TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(data.closingBalance)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cash Flow by Activities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operating Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getFlowColor(data.operatingActivities)}`}>
              {formatCurrency(data.operatingActivities)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cash from day-to-day operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getFlowColor(data.investingActivities)}`}>
              {formatCurrency(data.investingActivities)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cash from investments and assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getFlowColor(data.financingActivities)}`}>
              {formatCurrency(data.financingActivities)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cash from loans and equity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Cash Flow */}
      {data.monthlyFlow && data.monthlyFlow.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
            <CardDescription>Month-by-month cash flow analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Inflow</TableHead>
                  <TableHead className="text-right">Outflow</TableHead>
                  <TableHead className="text-right">Net Flow</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.monthlyFlow || []).map((month, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(month.inflow)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(month.outflow)}
                    </TableCell>
                    <TableCell className={`text-right ${getFlowColor(month.netFlow)}`}>
                      {formatCurrency(month.netFlow)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(month.runningBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Cash Flow Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Cash Flow Ratio</span>
                <span className="font-semibold">
                  {data.totalOutflow > 0 ? (data.totalInflow / data.totalOutflow).toFixed(2) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Operating Cash Flow Ratio</span>
                <span className="font-semibold">
                  {data.totalInflow > 0 ? ((data.operatingActivities / data.totalInflow) * 100).toFixed(1) + '%' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cash Coverage Ratio</span>
                <span className="font-semibold">
                  {data.totalOutflow > 0 ? ((data.openingBalance / data.totalOutflow) * 100).toFixed(1) + '%' : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Position Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Opening Balance</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatCurrency(data.openingBalance)}</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Net Change</span>
                <div className="flex items-center gap-2">
                  {getFlowIcon(data.netCashFlow)}
                  <span className={`font-semibold ${getFlowColor(data.netCashFlow)}`}>
                    {formatCurrency(data.netCashFlow)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">Closing Balance</span>
                <span className="font-bold text-lg">{formatCurrency(data.closingBalance)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}