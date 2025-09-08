"use client"

import { useState, useEffect } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { useRouter } from "next/navigation"
import { ReportFilters, type ReportFilters as ReportFiltersType } from "@/components/report-filters"
import { FinancialSummaryReport } from "@/components/financial-summary-report"
import { ExpenseReport } from "@/components/expense-report"
import { createClient } from "@/lib/supabase/client"

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any>(null)
  const [filters, setFilters] = useState<ReportFiltersType>({
    reportType: "summary",
    dateRange: "this-month",
    startDate: "",
    endDate: "",
    category: "all",
    vendor: "all",
    customer: "all",
    paymentStatus: "all",
    approvalStatus: "all",
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
    setLoading(false)
  }

  const generateReport = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Build date filter
      let startDate = filters.startDate
      let endDate = filters.endDate

      if (filters.dateRange !== "custom") {
        const today = new Date()
        switch (filters.dateRange) {
          case "today":
            startDate = endDate = today.toISOString().split("T")[0]
            break
          case "this-month":
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
            endDate = today.toISOString().split("T")[0]
            break
          // Add other date range logic as needed
        }
      }

      if (filters.reportType === "summary") {
        // Generate Financial Summary Report with real data
        const [expensesResult, salesResult] = await Promise.all([
          supabase
            .from("expenses")
            .select(`amount, date, expense_categories(name), vendor`)
            .gte("date", startDate)
            .lte("date", endDate),
          supabase
            .from("sales")
            .select("sale_amount, profit_loss, profit_margin, product_type, transaction_date, customer_name")
            .gte("transaction_date", startDate)
            .lte("transaction_date", endDate),
        ])

        const expenses = expensesResult.data || []
        const sales = salesResult.data || []

        const totalRevenue = sales.reduce((sum: number, sale: any) => sum + (sale.sale_amount || 0), 0)
        const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
        const netProfit = totalRevenue - totalExpenses
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

        // Expenses by Category (real data)
        const categoryTotals: { [key: string]: number } = {}
        expenses.forEach((expense: any) => {
          const categoryName = expense.expense_categories?.name || "Other"
          categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + (expense.amount || 0)
        })
        const expensesByCategory = Object.entries(categoryTotals).map(([name, value]) => ({
          name,
          value,
          color: "#8b5cf6",
        }))

        // Sales by Product (real data)
        const productTotals: { [key: string]: number } = {}
        sales.forEach((sale: any) => {
          productTotals[sale.product_type] = (productTotals[sale.product_type] || 0) + (sale.sale_amount || 0)
        })
        const salesByProduct = Object.entries(productTotals).map(([name, value]) => ({
          name,
          value,
        }))

        // Monthly Trends (real data)
        // Get all months in range
        const months: string[] = []
        const monthMap: { [key: string]: { revenue: number; expenses: number; profit: number } } = {}
        const start = new Date(startDate)
        const end = new Date(endDate)
        let d = new Date(start.getFullYear(), start.getMonth(), 1)
        while (d <= end) {
          const monthName = d.toLocaleDateString("en-US", { month: "short" })
          months.push(monthName)
          monthMap[monthName] = { revenue: 0, expenses: 0, profit: 0 }
          d.setMonth(d.getMonth() + 1)
        }
        sales.forEach((sale: any) => {
          const date = new Date(sale.transaction_date)
          const monthName = date.toLocaleDateString("en-US", { month: "short" })
          if (monthMap[monthName]) {
            monthMap[monthName].revenue += sale.sale_amount || 0
          }
        })
        expenses.forEach((expense: any) => {
          const date = new Date(expense.date)
          const monthName = date.toLocaleDateString("en-US", { month: "short" })
          if (monthMap[monthName]) {
            monthMap[monthName].expenses += expense.amount || 0
          }
        })
        months.forEach((month) => {
          monthMap[month].profit = monthMap[month].revenue - monthMap[month].expenses
        })
        const monthlyTrends = months.map((month) => ({
          month,
          revenue: monthMap[month].revenue,
          expenses: monthMap[month].expenses,
          profit: monthMap[month].profit,
        }))

        // Top Vendors (real data)
        const vendorTotals: { [key: string]: { amount: number; transactions: number } } = {}
        expenses.forEach((expense: any) => {
          const vendor = expense.vendor || "Unknown"
          if (!vendorTotals[vendor]) vendorTotals[vendor] = { amount: 0, transactions: 0 }
          vendorTotals[vendor].amount += expense.amount || 0
          vendorTotals[vendor].transactions += 1
        })
        const topVendors = Object.entries(vendorTotals)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 3)

        // Top Customers (real data)
        const customerTotals: { [key: string]: { amount: number; transactions: number } } = {}
        sales.forEach((sale: any) => {
          const customer = sale.customer_name || "Unknown"
          if (!customerTotals[customer]) customerTotals[customer] = { amount: 0, transactions: 0 }
          customerTotals[customer].amount += sale.sale_amount || 0
          customerTotals[customer].transactions += 1
        })
        const topCustomers = Object.entries(customerTotals)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 3)

        setReportData({
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin,
          totalTransactions: sales.length + expenses.length,
          averageTransactionValue: (totalRevenue + totalExpenses) / (sales.length + expenses.length) || 0,
          expensesByCategory,
          salesByProduct,
          monthlyTrends,
          topVendors,
          topCustomers,
        })
      } else if (filters.reportType === "expenses") {
        // Generate Expense Report
        const { data: expenses } = await supabase
          .from("expenses")
          .select(`
            id,
            date,
            vendor,
            amount,
            approval_status,
            paid_through,
            reference_number,
            notes,
            expense_categories(name)
          `)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false })

        const processedExpenses =
          expenses?.map((expense: any) => ({
            ...expense,
            category: expense.expense_categories?.name || "Uncategorized",
          })) || []

        const totalAmount = processedExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0)
        const totalCount = processedExpenses.length

        // Category breakdown
        const categoryTotals: { [key: string]: { amount: number; count: number } } = {}
        processedExpenses.forEach((expense: any) => {
          const category = expense.category
          if (!categoryTotals[category]) {
            categoryTotals[category] = { amount: 0, count: 0 }
          }
          categoryTotals[category].amount += expense.amount
          categoryTotals[category].count += 1
        })

        const categoryBreakdown = Object.entries(categoryTotals).map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count,
        }))

        // Status breakdown
        const statusTotals: { [key: string]: { amount: number; count: number } } = {}
        processedExpenses.forEach((expense: any) => {
          const status = expense.approval_status
          if (!statusTotals[status]) {
            statusTotals[status] = { amount: 0, count: 0 }
          }
          statusTotals[status].amount += expense.amount
          statusTotals[status].count += 1
        })

        const statusBreakdown = Object.entries(statusTotals).map(([status, data]) => ({
          status,
          amount: data.amount,
          count: data.count,
        }))

        setReportData({
          expenses: processedExpenses,
          totalAmount,
          totalCount,
          categoryBreakdown,
          statusBreakdown,
        })
      }
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (format: "pdf" | "csv" | "excel") => {
    if (!reportData) return

    if (filters.reportType === "summary") {
      // Financial Summary Report Export
      if (format === "pdf") {
        const doc = new jsPDF()
        doc.text("Financial Summary Report", 14, 16)
        doc.text(`Date Range: ${getDateRangeLabel()}`, 14, 24)
        autoTable(doc, {
          startY: 30,
          head: [["Metric", "Value"]],
          body: [
            ["Total Revenue", reportData.totalRevenue],
            ["Total Expenses", reportData.totalExpenses],
            ["Net Profit", reportData.netProfit],
            ["Profit Margin", `${reportData.profitMargin.toFixed(2)}%`],
            ["Total Transactions", reportData.totalTransactions],
            ["Avg Transaction Value", reportData.averageTransactionValue],
          ],
        })
        doc.save("financial-summary-report.pdf")
      } else if (format === "csv" || format === "excel") {
        // Prepare data for CSV/Excel
        const rows = [
          ["Metric", "Value"],
          ["Total Revenue", reportData.totalRevenue],
          ["Total Expenses", reportData.totalExpenses],
          ["Net Profit", reportData.netProfit],
          ["Profit Margin", `${reportData.profitMargin.toFixed(2)}%`],
          ["Total Transactions", reportData.totalTransactions],
          ["Avg Transaction Value", reportData.averageTransactionValue],
        ]
        if (format === "csv") {
          const csv = Papa.unparse(rows)
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = "financial-summary-report.csv"
          a.click()
          URL.revokeObjectURL(url)
        } else {
          const ws = XLSX.utils.aoa_to_sheet(rows)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Summary")
          XLSX.writeFile(wb, "financial-summary-report.xlsx")
        }
      }
    } else if (filters.reportType === "expenses") {
      // Expense Report Export
      const expenseRows = reportData.expenses.map((exp: any) => [
        exp.date,
        exp.vendor,
        exp.category,
        exp.amount,
        exp.approval_status,
        exp.paid_through,
        exp.reference_number,
        exp.notes,
      ])
      const headers = [
        "Date",
        "Vendor",
        "Category",
        "Amount",
        "Status",
        "Payment Method",
        "Reference",
        "Notes",
      ]
      if (format === "pdf") {
        const doc = new jsPDF()
        doc.text("Expense Report", 14, 16)
        doc.text(`Date Range: ${getDateRangeLabel()}`, 14, 24)
        autoTable(doc, {
          startY: 30,
          head: [headers],
          body: expenseRows,
        })
        doc.save("expense-report.pdf")
      } else if (format === "csv" || format === "excel") {
        const allRows = [headers, ...expenseRows]
        if (format === "csv") {
          const csv = Papa.unparse(allRows)
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = "expense-report.csv"
          a.click()
          URL.revokeObjectURL(url)
        } else {
          const ws = XLSX.utils.aoa_to_sheet(allRows)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Expenses")
          XLSX.writeFile(wb, "expense-report.xlsx")
        }
      }
    } else {
      alert("Export for this report type is not implemented yet.")
    }
  }

  const getDateRangeLabel = () => {
    switch (filters.dateRange) {
      case "today":
        return "Today"
      case "this-week":
        return "This Week"
      case "this-month":
        return "This Month"
      case "this-quarter":
        return "This Quarter"
      case "this-year":
        return "This Year"
      case "last-month":
        return "Last Month"
      case "custom":
        return `${filters.startDate} to ${filters.endDate}`
      default:
        return filters.dateRange
    }
  }

  if (loading && !reportData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Financial Reports</h1>
        <p className="text-muted-foreground mt-2">Generate comprehensive financial reports and analytics</p>
      </div>

      <ReportFilters onFiltersChange={setFilters} onGenerateReport={generateReport} onExportReport={exportReport} />

      {reportData && (
        <div>
          {filters.reportType === "summary" && (
            <FinancialSummaryReport data={reportData} dateRange={getDateRangeLabel()} />
          )}
          {filters.reportType === "expenses" && <ExpenseReport data={reportData} dateRange={getDateRangeLabel()} />}
        </div>
      )}

      {!reportData && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Configure your filters and click "Generate Report" to view your financial data
          </p>
        </div>
      )}
    </div>
  )
}
