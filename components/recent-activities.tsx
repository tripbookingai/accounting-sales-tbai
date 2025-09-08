"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Receipt, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"

interface RecentExpense {
  id: string
  date: string
  vendor: string | null
  amount: number
  category: string
  approval_status: string
}

interface RecentSale {
  id: string
  transaction_date: string
  customer_name: string
  product_type: string
  sale_amount: number
  payment_status: string
}

interface RecentActivitiesProps {
  recentExpenses: RecentExpense[]
  recentSales: RecentSale[]
}

export function RecentActivities({ recentExpenses, recentSales }: RecentActivitiesProps) {
  const getStatusColor = (status: string, type: "expense" | "sale") => {
    if (type === "expense") {
      switch (status) {
        case "Approved":
          return "bg-green-100 text-green-800"
        case "Paid":
          return "bg-blue-100 text-blue-800"
        default:
          return "bg-yellow-100 text-yellow-800"
      }
    } else {
      switch (status) {
        case "Paid":
          return "bg-green-100 text-green-800"
        case "Partial":
          return "bg-yellow-100 text-yellow-800"
        default:
          return "bg-red-100 text-red-800"
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Expenses
            </CardTitle>
            <CardDescription>Latest expense entries</CardDescription>
          </div>
          <Link href="/expenses">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No expenses recorded yet</p>
              </div>
            ) : (
              recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{expense.vendor || "Unknown Vendor"}</span>
                      <Badge className={`text-xs ${getStatusColor(expense.approval_status, "expense")}`}>
                        {expense.approval_status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {expense.category} • {new Date(expense.date).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ৳{expense.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Sales
            </CardTitle>
            <CardDescription>Latest sales transactions</CardDescription>
          </div>
          <Link href="/sales">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No sales recorded yet</p>
              </div>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{sale.customer_name}</span>
                      <Badge className={`text-xs ${getStatusColor(sale.payment_status, "sale")}`}>
                        {sale.payment_status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sale.product_type} • {new Date(sale.transaction_date).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ৳{sale.sale_amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
