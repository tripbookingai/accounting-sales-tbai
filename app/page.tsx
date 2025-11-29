"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, TrendingUp, Users, BarChart3, AlertCircle, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DashboardCharts } from "@/components/dashboard-charts"
import { RecentActivities } from "@/components/recent-activities"
import { QuickActions } from "@/components/quick-actions"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalSales: 0,
    totalCustomers: 0,
    averageMargin: 0,
    pendingExpenses: 0,
    overduePayments: 0,
    thisMonthExpenses: 0,
    thisMonthSales: 0,
  })
  const [chartData, setChartData] = useState({
    expensesByCategory: [] as { name: string; value: number; color: string }[],
    monthlyData: [] as { month: string; expenses: number; sales: number; profit: number }[],
    salesByProduct: [] as { name: string; value: number; color: string }[],
    topVendors: [] as { name: string; value: number; color: string }[],
    topCustomers: [] as { name: string; value: number; color: string }[],
    expenseTrendsByCategory: [] as any[],
    salesTrendsByProduct: [] as any[],
  })
  const [recentActivities, setRecentActivities] = useState<{
    recentExpenses: any[]
    recentSales: any[]
  }>({
    recentExpenses: [],
    recentSales: [],
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    setUser(user)
    await Promise.all([loadStats(), loadChartData(), loadRecentActivities()])
    setLoading(false)
  }

  const loadStats = async () => {
    try {
      const supabase = createClient()

      // Load expenses data
      const { data: expenses } = await supabase.from("expenses").select("amount, approval_status, date")

      // Load sales data
      const { data: sales } = await supabase
        .from("sales")
        .select("sale_amount, profit_margin, payment_status, outstanding_balance, transaction_date")

      // Load customers count
      const { data: customers } = await supabase.from("customers").select("id")

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const totalExpenses = (expenses ?? []).reduce((sum, exp) => sum + (exp.amount || 0), 0)
      const totalSales = (sales ?? []).reduce((sum, sale) => sum + (sale.sale_amount || 0), 0)
      const totalCustomers = customers?.length || 0
      const averageMargin =
        (sales && sales.length > 0)
          ? sales.reduce((sum, sale) => sum + (sale.profit_margin || 0), 0) / sales.length
          : 0

      const pendingExpenses = (expenses ?? []).filter((exp) => exp.approval_status === "Pending").length
      const overduePayments = (sales ?? []).filter((sale) => (sale.outstanding_balance || 0) > 0).length

      const thisMonthExpenses =
        (expenses ?? [])
          .filter((exp) => {
            const expDate = new Date(exp.date)
            return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
          })
          .reduce((sum, exp) => sum + (exp.amount || 0), 0)

      const thisMonthSales =
        (sales ?? [])
          .filter((sale) => {
            const saleDate = new Date(sale.transaction_date)
            return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
          })
          .reduce((sum, sale) => sum + (sale.sale_amount || 0), 0)

      setStats({
        totalExpenses,
        totalSales,
        totalCustomers,
        averageMargin,
        pendingExpenses,
        overduePayments,
        thisMonthExpenses,
        thisMonthSales,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const loadChartData = async () => {
  // ...existing code...
  // ...existing code...
    try {
      const supabase = createClient()

      // Load all expenses and sales for the last 12 months
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      const startDateStr = startDate.toISOString().split("T")[0]

      // Expenses with category and vendor
      const { data: expenses } = await supabase
        .from("expenses")
        .select(`amount, date, vendor, expense_categories(name, parent_id)`)
      console.log("Expenses from Supabase:", expenses)

      // Sales with product type and customer
      const { data: sales } = await supabase
        .from("sales")
        .select("sale_amount, profit_loss, transaction_date, product_type, customer_name")
      console.log("Sales from Supabase:", sales)

      // Debug: print all expense and sales dates after both are defined, just before setChartData
      if (expenses) {
        console.log("Expense dates:", expenses.map((e: any) => e.date))
      }
      if (sales) {
        console.log("Sales dates:", sales.map((s: any) => s.transaction_date))
      }

      // --- Expenses by Category ---
      const categoryTotals: Record<string, number> = {}
      expenses?.forEach((expense) => {
        let categoryName = "Other"
        if (expense.expense_categories && Array.isArray(expense.expense_categories) && expense.expense_categories.length > 0) {
          categoryName = expense.expense_categories[0].name || "Other"
        }
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + (Number(expense.amount) || 0)
      })
      const expensesByCategory = Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value: Number(value),
        color: "#8b5cf6",
      }))

      // --- Sales by Product Type ---
      const normalizeProductType = (p: string | undefined) => {
        if (!p) return "Other"
        const s = String(p).toLowerCase().trim()
        if (s.includes("ship")) return "Ship Ticket"
        // add other normalizations if needed in future
        return p
      }

      const productTotals: Record<string, number> = {}
      sales?.forEach((sale) => {
        const prod = normalizeProductType(sale.product_type)
        productTotals[prod] = (productTotals[prod] || 0) + (Number(sale.sale_amount) || 0)
      })
      const salesByProductChart = Object.entries(productTotals).map(([name, value]) => ({
        name,
        value: Number(value),
        color: "#3b82f6",
      }))

      // --- Monthly Financial Trends (real data) ---
      const monthlyMap: Record<string, { month: string; expenses: number; sales: number; profit: number }> = {}
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        monthlyMap[key] = {
          month: d.toLocaleDateString("en-US", { month: "short" }),
          expenses: 0,
          sales: 0,
          profit: 0,
        }
      }
      expenses?.forEach((exp) => {
        const d = new Date(exp.date)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        if (monthlyMap[key]) monthlyMap[key].expenses += Number(exp.amount) || 0
      })
      sales?.forEach((sale) => {
        const d = new Date(sale.transaction_date)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        if (monthlyMap[key]) {
          monthlyMap[key].sales += Number(sale.sale_amount) || 0
          monthlyMap[key].profit += Number(sale.profit_loss) || 0
        }
      })
      // Only last 6 months for chart
  const monthlyData = Object.values(monthlyMap).slice(-6) as { month: string; expenses: number; sales: number; profit: number }[]


      // --- Top Vendors by Expense ---
      const vendorTotals: Record<string, number> = {}
      expenses?.forEach((exp) => {
        if (exp.vendor) vendorTotals[exp.vendor] = (vendorTotals[exp.vendor] || 0) + (Number(exp.amount) || 0)
      })
      const topVendors = Object.entries(vendorTotals)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 5)
        .map(([name, value]) => ({ name, value: Number(value), color: "#f97316" }))

      // --- Top Customers by Sales ---
      const customerTotals: Record<string, number> = {}
      sales?.forEach((sale) => {
        if (sale.customer_name) customerTotals[sale.customer_name] = (customerTotals[sale.customer_name] || 0) + (Number(sale.sale_amount) || 0)
      })
      const topCustomers = Object.entries(customerTotals)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 5)
        .map(([name, value]) => ({ name, value: Number(value), color: "#10b981" }))

      // --- Expense Trends by Category (last 6 months) ---
      const categoryTrends: Record<string, Record<string, number>> = {}
      expenses?.forEach((exp) => {
        const d = new Date(exp.date)
        const month = d.toLocaleDateString("en-US", { month: "short" })
        let cat = "Other"
        if (exp.expense_categories && Array.isArray(exp.expense_categories) && exp.expense_categories.length > 0) {
          cat = exp.expense_categories[0].name || "Other"
        }
        if (!categoryTrends[cat]) categoryTrends[cat] = {}
        categoryTrends[cat][month] = (categoryTrends[cat][month] || 0) + (Number(exp.amount) || 0)
      })
      // Format for chart: [{month, cat1: value, cat2: value, ...}]
      const months = Object.values(monthlyMap).slice(-6).map((m) => (m as { month: string }).month)
      const expenseTrendsByCategory = months.map((month) => {
        const row: Record<string, any> = { month }
        Object.keys(categoryTrends).forEach((cat) => {
          row[cat] = categoryTrends[cat][month] || 0
        })
        return row
      })

      // --- Sales Trends by Product Type (last 6 months) ---
      const productTrends: Record<string, Record<string, number>> = {}
      sales?.forEach((sale) => {
        const d = new Date(sale.transaction_date)
        const month = d.toLocaleDateString("en-US", { month: "short" })
        const prod = normalizeProductType(sale.product_type)
        if (!productTrends[prod]) productTrends[prod] = {}
        productTrends[prod][month] = (productTrends[prod][month] || 0) + (Number(sale.sale_amount) || 0)
      })
      const salesTrendsByProduct = months.map((month) => {
        const row: Record<string, any> = { month }
        Object.keys(productTrends).forEach((prod) => {
          row[prod] = productTrends[prod][month] || 0
        })
        return row
      })

      // Debug processed data for monthly trends and expense trends by category
      console.log("Processed monthlyData:", monthlyData)
      console.log("Processed expenseTrendsByCategory:", expenseTrendsByCategory)
      setChartData({
        expensesByCategory: expensesByCategory as { name: string; value: number; color: string }[],
        monthlyData: monthlyData as { month: string; expenses: number; sales: number; profit: number }[],
        salesByProduct: salesByProductChart as { name: string; value: number; color: string }[],
        topVendors: topVendors as { name: string; value: number; color: string }[],
        topCustomers: topCustomers as { name: string; value: number; color: string }[],
        expenseTrendsByCategory,
          salesTrendsByProduct,
      })
    } catch (error) {
      console.error("Error loading chart data:", error)
    }
  }

  const loadRecentActivities = async () => {
    try {
      const supabase = createClient()

      // Load recent expenses
      const { data: recentExpenses } = await supabase
        .from("expenses")
        .select(`
          id,
          date,
          vendor,
          amount,
          approval_status,
          expense_categories(name)
        `)
        .order("created_at", { ascending: false })
        .limit(5)

      // Load recent sales
      const { data: recentSales } = await supabase
        .from("sales")
        .select("id, transaction_date, customer_name, product_type, sale_amount, payment_status")
        .order("created_at", { ascending: false })
        .limit(5)

      const processedExpenses =
        recentExpenses?.map((expense) => ({
          ...expense,
          category:
            Array.isArray(expense.expense_categories) && expense.expense_categories.length > 0
              ? expense.expense_categories[0].name || "Uncategorized"
              : "Uncategorized",
        })) || []

      setRecentActivities({
        recentExpenses: processedExpenses,
        recentSales: recentSales || [],
      })
    } catch (error) {
      console.error("Error loading recent activities:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-balance mb-2">
          Welcome back, {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
        </h1>
        <p className="text-muted-foreground">Here's an overview of your business finances</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{stats.totalExpenses.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              ৳{stats.thisMonthExpenses.toLocaleString("en-BD")} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{stats.totalSales.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">৳{stats.thisMonthSales.toLocaleString("en-BD")} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Total customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit Margin</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      {(stats.pendingExpenses > 0 || stats.overduePayments > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.pendingExpenses > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <CardTitle className="text-yellow-800">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700">
                  You have {stats.pendingExpenses} expense{stats.pendingExpenses !== 1 ? "s" : ""} waiting for approval
                </p>
                <Link href="/expenses">
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                    Review Expenses
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {stats.overduePayments > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <CardTitle className="text-red-800">Outstanding Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">
                  {stats.overduePayments} sale{stats.overduePayments !== 1 ? "s" : ""} have outstanding balances
                </p>
                <Link href="/sales">
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                    Review Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions - moved to top and styled as grid */}
      <div className="mb-8">
        <QuickActions />
      </div>

      {/* Charts */}
      <DashboardCharts
        expensesByCategory={chartData.expensesByCategory}
        monthlyData={chartData.monthlyData}
        salesByProduct={chartData.salesByProduct}
        topVendors={chartData.topVendors}
        topCustomers={chartData.topCustomers}
        expenseTrendsByCategory={chartData.expenseTrendsByCategory}
        salesTrendsByProduct={chartData.salesTrendsByProduct}
      />

      {/* Recent Activities */}
      <RecentActivities {...recentActivities} />
    </div>
  )
}
