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
import { SalesReport } from "@/components/sales-report"
import { ProfitLossReport } from "@/components/profit-loss-report"
import { CashFlowReport } from "@/components/cash-flow-report"
import { VendorAnalysisReport } from "@/components/vendor-analysis-report"
import { CustomerAnalysisReport } from "@/components/customer-analysis-report"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, formatCurrencyForExport } from "@/lib/utils"

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
    productType: "all",
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
          case "this-week":
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
            startDate = weekStart.toISOString().split("T")[0]
            endDate = new Date().toISOString().split("T")[0]
            break
          case "this-month":
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
            endDate = new Date().toISOString().split("T")[0]
            break
          case "this-quarter":
            const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
            startDate = quarterStart.toISOString().split("T")[0]
            endDate = new Date().toISOString().split("T")[0]
            break
          case "this-year":
            startDate = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0]
            endDate = new Date().toISOString().split("T")[0]
            break
          case "last-month":
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            startDate = lastMonth.toISOString().split("T")[0]
            endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0]
            break
        }
      }

      // Fetch common data
      const [expensesResult, salesResult, vendorsResult, customersResult] = await Promise.all([
        supabase
          .from("expenses")
          .select(`*, expense_categories(name)`)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false }),
        supabase
          .from("sales")
          .select("*")
          .gte("transaction_date", startDate)
          .lte("transaction_date", endDate)
          .order("transaction_date", { ascending: false }),
        supabase
          .from("vendors")
          .select("*"),
        supabase
          .from("customers")
          .select("*")
      ])

      const expenses = expensesResult.data || []
      const sales = salesResult.data || []
      const vendors = vendorsResult.data || []
      const customers = customersResult.data || []

      if (filters.reportType === "summary") {
        // Generate Financial Summary Report
        // Filter sales by product type if specified
        let filteredSales = sales
        if (filters.productType !== "all") {
          filteredSales = sales.filter((sale: any) => sale.product_type === filters.productType)
        }

        const totalRevenue = filteredSales.reduce((sum: number, sale: any) => sum + (sale.sale_amount || 0), 0)
        const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
        const netProfit = totalRevenue - totalExpenses
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

        // Expenses by Category
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

        // Sales by Product
        const productTotals: { [key: string]: number } = {}
        filteredSales.forEach((sale: any) => {
          productTotals[sale.product_type] = (productTotals[sale.product_type] || 0) + (sale.sale_amount || 0)
        })
        const salesByProduct = Object.entries(productTotals).map(([name, value]) => ({
          name,
          value,
        }))

        // Monthly Trends
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
        filteredSales.forEach((sale: any) => {
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

        // Top Vendors
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

        // Top Customers
        const customerTotals: { [key: string]: { amount: number; transactions: number } } = {}
        filteredSales.forEach((sale: any) => {
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
          totalTransactions: filteredSales.length + expenses.length,
          averageTransactionValue: (totalRevenue + totalExpenses) / (filteredSales.length + expenses.length) || 0,
          expensesByCategory,
          salesByProduct,
          monthlyTrends,
          topVendors,
          topCustomers,
        })

      } else if (filters.reportType === "expenses") {
        // Generate Expense Report
        const processedExpenses = expenses.map((expense: any) => ({
          ...expense,
          category: expense.expense_categories?.name || "Uncategorized",
        }))

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

      } else if (filters.reportType === "sales") {
        // Generate Sales Report
        // Filter sales by product type if specified
        let filteredSales = sales
        if (filters.productType !== "all") {
          filteredSales = sales.filter((sale: any) => sale.product_type === filters.productType)
        }

        const totalSales = filteredSales.reduce((sum, sale: any) => sum + (sale.sale_amount || 0), 0)
        const totalCount = filteredSales.length
        const totalProfit = filteredSales.reduce((sum, sale: any) => sum + (sale.profit_loss || 0), 0)
        const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0
        const averageSaleValue = totalCount > 0 ? totalSales / totalCount : 0

        // Product breakdown
        const productTotals: { [key: string]: { amount: number; count: number } } = {}
        filteredSales.forEach((sale: any) => {
          const product = sale.product_type
          if (!productTotals[product]) {
            productTotals[product] = { amount: 0, count: 0 }
          }
          productTotals[product].amount += sale.sale_amount || 0
          productTotals[product].count += 1
        })

        const productBreakdown = Object.entries(productTotals).map(([product, data]) => ({
          product,
          amount: data.amount,
          count: data.count,
        }))

        // Status breakdown
        const statusTotals: { [key: string]: { amount: number; count: number } } = {}
        filteredSales.forEach((sale: any) => {
          const status = sale.payment_status
          if (!statusTotals[status]) {
            statusTotals[status] = { amount: 0, count: 0 }
          }
          statusTotals[status].amount += sale.sale_amount || 0
          statusTotals[status].count += 1
        })

        const statusBreakdown = Object.entries(statusTotals).map(([status, data]) => ({
          status,
          amount: data.amount,
          count: data.count,
        }))

        // Top customers
        const customerTotals: { [key: string]: { amount: number; transactions: number } } = {}
        filteredSales.forEach((sale: any) => {
          const customer = sale.customer_name || "Unknown"
          if (!customerTotals[customer]) customerTotals[customer] = { amount: 0, transactions: 0 }
          customerTotals[customer].amount += sale.sale_amount || 0
          customerTotals[customer].transactions += 1
        })
        const topCustomers = Object.entries(customerTotals)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)

        // Hotel nights calculation
        let totalHotelNights = 0
        const hotelNightsByVendorMap: { [key: string]: { nights: number; amount: number; bookings: number } } = {}
        
        filteredSales.forEach((sale: any) => {
          if (sale.product_type === "Hotel") {
            // Always recalculate nights using the new formula: (rooms × nights)
            let nights = 0
            if (sale.checkin_date && sale.checkout_date) {
              const checkin = new Date(sale.checkin_date)
              const checkout = new Date(sale.checkout_date)
              const daysDiff = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))
              const rooms = sale.number_of_rooms || 1
              nights = daysDiff > 0 ? daysDiff * rooms : 0
              
              // Log for debugging - remove this later
              console.log(`Hotel ${sale.vendor}: ${rooms} rooms × ${daysDiff} days = ${nights} total nights`)
            } else if (sale.nights) {
              // Fallback to stored value only if dates are not available
              nights = sale.nights
            }
            
            if (nights > 0) {
              totalHotelNights += nights
              const vendor = sale.vendor || "Unknown Vendor"
              if (!hotelNightsByVendorMap[vendor]) {
                hotelNightsByVendorMap[vendor] = { nights: 0, amount: 0, bookings: 0 }
              }
              hotelNightsByVendorMap[vendor].nights += nights
              hotelNightsByVendorMap[vendor].amount += sale.sale_amount || 0
              hotelNightsByVendorMap[vendor].bookings += 1
            }
          }
        })

        const hotelNightsByVendor = Object.entries(hotelNightsByVendorMap)
          .map(([vendor, data]) => ({ vendor, ...data }))
          .sort((a, b) => b.nights - a.nights)

        setReportData({
          sales: filteredSales,
          totalSales,
          totalCount,
          productBreakdown,
          statusBreakdown,
          topCustomers,
          averageSaleValue,
          totalProfit,
          profitMargin,
          totalHotelNights: totalHotelNights > 0 ? totalHotelNights : undefined,
          hotelNightsByVendor: hotelNightsByVendor.length > 0 ? hotelNightsByVendor : undefined,
        })

      } else if (filters.reportType === "profit-loss") {
        // Generate Profit & Loss Report
        const totalRevenue = sales.reduce((sum, sale: any) => sum + (sale.sale_amount || 0), 0)
        const totalExpenses = expenses.reduce((sum, expense: any) => sum + (expense.amount || 0), 0)
        const grossProfit = totalRevenue - totalExpenses
        const netProfit = grossProfit // Simplified for now
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

        // Revenue by product
        const productTotals: { [key: string]: number } = {}
        sales.forEach((sale: any) => {
          productTotals[sale.product_type] = (productTotals[sale.product_type] || 0) + (sale.sale_amount || 0)
        })
        const revenueByProduct = Object.entries(productTotals).map(([product, amount]) => ({
          product,
          amount,
        }))

        // Expenses by category
        const categoryTotals: { [key: string]: number } = {}
        expenses.forEach((expense: any) => {
          const category = expense.expense_categories?.name || "Other"
          categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0)
        })
        const expensesByCategory = Object.entries(categoryTotals).map(([category, amount]) => ({
          category,
          amount,
        }))

        // Monthly comparison
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
        const monthlyComparison = months.map((month) => ({
          month,
          revenue: monthMap[month].revenue,
          expenses: monthMap[month].expenses,
          profit: monthMap[month].profit,
        }))

        setReportData({
          totalRevenue,
          totalExpenses,
          grossProfit,
          netProfit,
          profitMargin,
          revenueByProduct,
          expensesByCategory,
          monthlyComparison,
        })

      } else if (filters.reportType === "cash-flow") {
        // Generate Cash Flow Report
        const totalInflow = sales.reduce((sum, sale: any) => sum + (sale.payment_received || 0), 0)
        const totalOutflow = expenses.reduce((sum, expense: any) => sum + (expense.amount || 0), 0)
        const netCashFlow = totalInflow - totalOutflow
        const openingBalance = 10000 // This should come from settings/previous period
        const closingBalance = openingBalance + netCashFlow

        // Cash inflows by source
        const inflowSources: { [key: string]: number } = {}
        sales.forEach((sale: any) => {
          const source = sale.payment_method || "Other"
          inflowSources[source] = (inflowSources[source] || 0) + (sale.payment_received || 0)
        })
        const cashInflows = Object.entries(inflowSources).map(([source, amount]) => ({
          source,
          amount,
        }))

        // Cash outflows by category
        const outflowCategories: { [key: string]: number } = {}
        expenses.forEach((expense: any) => {
          const category = expense.expense_categories?.name || "Other"
          outflowCategories[category] = (outflowCategories[category] || 0) + (expense.amount || 0)
        })
        const cashOutflows = Object.entries(outflowCategories).map(([category, amount]) => ({
          category,
          amount,
        }))

        // Monthly cash flow
        const months: string[] = []
        const monthMap: { [key: string]: { inflow: number; outflow: number } } = {}
        const start = new Date(startDate)
        const end = new Date(endDate)
        let d = new Date(start.getFullYear(), start.getMonth(), 1)
        let runningBalance = openingBalance
        while (d <= end) {
          const monthName = d.toLocaleDateString("en-US", { month: "short" })
          months.push(monthName)
          monthMap[monthName] = { inflow: 0, outflow: 0 }
          d.setMonth(d.getMonth() + 1)
        }
        sales.forEach((sale: any) => {
          const date = new Date(sale.transaction_date)
          const monthName = date.toLocaleDateString("en-US", { month: "short" })
          if (monthMap[monthName]) {
            monthMap[monthName].inflow += sale.payment_received || 0
          }
        })
        expenses.forEach((expense: any) => {
          const date = new Date(expense.date)
          const monthName = date.toLocaleDateString("en-US", { month: "short" })
          if (monthMap[monthName]) {
            monthMap[monthName].outflow += expense.amount || 0
          }
        })
        const monthlyFlow = months.map((month) => {
          const netFlow = monthMap[month].inflow - monthMap[month].outflow
          runningBalance += netFlow
          return {
            month,
            inflow: monthMap[month].inflow,
            outflow: monthMap[month].outflow,
            netFlow,
            runningBalance,
          }
        })

        setReportData({
          openingBalance,
          closingBalance,
          totalInflow,
          totalOutflow,
          netCashFlow,
          cashInflows,
          cashOutflows,
          monthlyFlow,
          operatingActivities: totalInflow - totalOutflow,
          investingActivities: 0, // Placeholder
          financingActivities: 0, // Placeholder
        })

      } else if (filters.reportType === "vendor-analysis") {
        // Generate Vendor Analysis Report with separated Sale and Expense Vendors
        
        // =================================
        // SALE VENDORS ANALYSIS
        // =================================
        const saleVendorTotals: { [key: string]: { 
          totalAmount: number; 
          transactionCount: number; 
          lastTransaction: string;
          category: string;
        } } = {}
        
        // Calculate totals for sale vendors
        sales.forEach((sale: any) => {
          const vendor = sale.vendor_name || sale.vendor || "Unknown"
          if (!saleVendorTotals[vendor]) {
            saleVendorTotals[vendor] = { 
              totalAmount: 0, 
              transactionCount: 0, 
              lastTransaction: sale.transaction_date,
              category: sale.product_type || "Other"
            }
          }
          saleVendorTotals[vendor].totalAmount += sale.sale_amount || 0
          saleVendorTotals[vendor].transactionCount += 1
          if (new Date(sale.transaction_date) > new Date(saleVendorTotals[vendor].lastTransaction)) {
            saleVendorTotals[vendor].lastTransaction = sale.transaction_date
          }
        })

        const saleTopVendors = Object.entries(saleVendorTotals)
          .map(([name, data]) => ({
            name,
            totalAmount: data.totalAmount,
            transactionCount: data.transactionCount,
            averageTransaction: data.transactionCount > 0 ? data.totalAmount / data.transactionCount : 0,
            lastTransaction: data.lastTransaction,
            category: data.category,
          }))
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 10)

        // Sale vendors by category
        const saleCategoryTotals: { [key: string]: { vendorCount: number; totalAmount: number } } = {}
        Object.entries(saleVendorTotals).forEach(([vendor, data]) => {
          const category = data.category
          if (!saleCategoryTotals[category]) {
            saleCategoryTotals[category] = { vendorCount: 0, totalAmount: 0 }
          }
          saleCategoryTotals[category].vendorCount += 1
          saleCategoryTotals[category].totalAmount += data.totalAmount
        })

        const saleVendorsByCategory = Object.entries(saleCategoryTotals).map(([category, data]) => ({
          category,
          vendorCount: data.vendorCount,
          totalAmount: data.totalAmount,
          averageAmount: data.vendorCount > 0 ? data.totalAmount / data.vendorCount : 0,
        }))

        const saleVendorsData = {
          totalVendors: Object.keys(saleVendorTotals).length,
          totalRevenue: Object.values(saleVendorTotals).reduce((sum, vendor) => sum + vendor.totalAmount, 0),
          averageRevenuePerVendor: Object.keys(saleVendorTotals).length > 0 ? 
            Object.values(saleVendorTotals).reduce((sum, vendor) => sum + vendor.totalAmount, 0) / Object.keys(saleVendorTotals).length : 0,
          topVendors: saleTopVendors,
          vendorsByCategory: saleVendorsByCategory,
        }

        // =================================
        // EXPENSE VENDORS ANALYSIS
        // =================================
        const expenseVendorTotals: { [key: string]: { 
          totalAmount: number; 
          transactionCount: number; 
          lastTransaction: string;
          category: string;
        } } = {}
        
        expenses.forEach((expense: any) => {
          const vendor = expense.vendor || "Unknown"
          if (!expenseVendorTotals[vendor]) {
            expenseVendorTotals[vendor] = { 
              totalAmount: 0, 
              transactionCount: 0, 
              lastTransaction: expense.date,
              category: expense.expense_categories?.name || "Other"
            }
          }
          expenseVendorTotals[vendor].totalAmount += expense.amount || 0
          expenseVendorTotals[vendor].transactionCount += 1
          if (new Date(expense.date) > new Date(expenseVendorTotals[vendor].lastTransaction)) {
            expenseVendorTotals[vendor].lastTransaction = expense.date
          }
        })

        const expenseTopVendors = Object.entries(expenseVendorTotals)
          .map(([name, data]) => ({
            name,
            totalAmount: data.totalAmount,
            transactionCount: data.transactionCount,
            averageTransaction: data.transactionCount > 0 ? data.totalAmount / data.transactionCount : 0,
            lastTransaction: data.lastTransaction,
            category: data.category,
          }))
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 10)

        // Expense vendors by category
        const expenseCategoryTotals: { [key: string]: { vendorCount: number; totalAmount: number } } = {}
        Object.entries(expenseVendorTotals).forEach(([vendor, data]) => {
          const category = data.category
          if (!expenseCategoryTotals[category]) {
            expenseCategoryTotals[category] = { vendorCount: 0, totalAmount: 0 }
          }
          expenseCategoryTotals[category].vendorCount += 1
          expenseCategoryTotals[category].totalAmount += data.totalAmount
        })

        const expenseVendorsByCategory = Object.entries(expenseCategoryTotals).map(([category, data]) => ({
          category,
          vendorCount: data.vendorCount,
          totalAmount: data.totalAmount,
          averageAmount: data.vendorCount > 0 ? data.totalAmount / data.vendorCount : 0,
        }))

        const expenseVendorsData = {
          totalVendors: Object.keys(expenseVendorTotals).length,
          totalSpent: Object.values(expenseVendorTotals).reduce((sum, vendor) => sum + vendor.totalAmount, 0),
          averageSpentPerVendor: Object.keys(expenseVendorTotals).length > 0 ? 
            Object.values(expenseVendorTotals).reduce((sum, vendor) => sum + vendor.totalAmount, 0) / Object.keys(expenseVendorTotals).length : 0,
          topVendors: expenseTopVendors,
          vendorsByCategory: expenseVendorsByCategory,
        }

        // =================================
        // LEGACY DATA FOR BACKWARD COMPATIBILITY
        // =================================
        const totalVendors = vendors.length
        const totalSpent = expenses.reduce((sum, expense: any) => sum + (expense.amount || 0), 0)
        const averageSpentPerVendor = totalVendors > 0 ? totalSpent / totalVendors : 0

        // Combined top vendors (for backward compatibility)
        const allVendors = [...saleTopVendors, ...expenseTopVendors]
        const topVendors = allVendors.sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10)

        // Combined vendors by category (for backward compatibility)
        const vendorsByCategory = [...saleVendorsByCategory, ...expenseVendorsByCategory]

        // Payment analysis (only for expense vendors)
        const paymentAnalysis = expenseTopVendors.slice(0, 5).map(vendor => {
          const vendorExpenses = expenses.filter(exp => exp.vendor === vendor.name)
          const paidAmount = vendorExpenses
            .filter(exp => exp.approval_status === "Paid")
            .reduce((sum, exp) => sum + (exp.amount || 0), 0)
          const pendingAmount = vendor.totalAmount - paidAmount
          const paymentRatio = vendor.totalAmount > 0 ? paidAmount / vendor.totalAmount : 0

          return {
            vendor: vendor.name,
            pendingAmount,
            paidAmount,
            totalAmount: vendor.totalAmount,
            paymentRatio,
          }
        })

        // Monthly spending (only for expenses)
        const months: string[] = []
        const monthMap: { [key: string]: { amount: number; vendorSet: Set<string>; transactions: number } } = {}
        const start = new Date(startDate)
        const end = new Date(endDate)
        let d = new Date(start.getFullYear(), start.getMonth(), 1)
        while (d <= end) {
          const monthName = d.toLocaleDateString("en-US", { month: "short" })
          months.push(monthName)
          monthMap[monthName] = { amount: 0, vendorSet: new Set(), transactions: 0 }
          d.setMonth(d.getMonth() + 1)
        }
        expenses.forEach((expense: any) => {
          const date = new Date(expense.date)
          const monthName = date.toLocaleDateString("en-US", { month: "short" })
          if (monthMap[monthName]) {
            monthMap[monthName].amount += expense.amount || 0
            monthMap[monthName].vendorSet.add(expense.vendor || "Unknown")
            monthMap[monthName].transactions += 1
          }
        })
        const monthlySpending = months.map((month) => ({
          month,
          amount: monthMap[month].amount,
          vendorCount: monthMap[month].vendorSet.size,
          transactions: monthMap[month].transactions,
        }))

        // Vendor performance (placeholder data for expense vendors)
        const vendorPerformance = expenseTopVendors.slice(0, 5).map(vendor => ({
          vendor: vendor.name,
          reliability: Math.floor(Math.random() * 40) + 60, // 60-100%
          avgResponseTime: Math.floor(Math.random() * 48) + 2, // 2-50 hours
          qualityRating: Math.floor(Math.random() * 40) + 60, // 60-100%
          costEffectiveness: Math.floor(Math.random() * 40) + 60, // 60-100%
        }))

        setReportData({
          totalVendors,
          totalSpent,
          averageSpentPerVendor,
          saleVendors: saleVendorsData,
          expenseVendors: expenseVendorsData,
          topVendors,
          vendorsByCategory,
          paymentAnalysis,
          monthlySpending,
          vendorPerformance,
        })

      } else if (filters.reportType === "customer-analysis") {
        // Generate Customer Analysis Report
        const totalCustomers = customers.length
        const totalRevenue = sales.reduce((sum, sale: any) => sum + (sale.sale_amount || 0), 0)
        const averageRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

        // Top customers
        const customerTotals: { [key: string]: { 
          totalAmount: number; 
          transactionCount: number; 
          lastTransaction: string;
          totalProfit: number;
          email: string;
          phone: string;
          customerSince: string;
        } } = {}
        
        sales.forEach((sale: any) => {
          const customer = sale.customer_name || "Unknown"
          if (!customerTotals[customer]) {
            customerTotals[customer] = { 
              totalAmount: 0, 
              transactionCount: 0, 
              lastTransaction: sale.transaction_date,
              totalProfit: 0,
              email: sale.customer_email || "",
              phone: sale.customer_phone || "",
              customerSince: sale.transaction_date,
            }
          }
          customerTotals[customer].totalAmount += sale.sale_amount || 0
          customerTotals[customer].totalProfit += sale.profit_loss || 0
          customerTotals[customer].transactionCount += 1
          if (new Date(sale.transaction_date) > new Date(customerTotals[customer].lastTransaction)) {
            customerTotals[customer].lastTransaction = sale.transaction_date
          }
          if (new Date(sale.transaction_date) < new Date(customerTotals[customer].customerSince)) {
            customerTotals[customer].customerSince = sale.transaction_date
          }
        })

        const topCustomers = Object.entries(customerTotals)
          .map(([name, data]) => ({
            name,
            email: data.email,
            phone: data.phone,
            totalAmount: data.totalAmount,
            transactionCount: data.transactionCount,
            averageTransaction: data.transactionCount > 0 ? data.totalAmount / data.transactionCount : 0,
            lastTransaction: data.lastTransaction,
            totalProfit: data.totalProfit,
            profitMargin: data.totalAmount > 0 ? (data.totalProfit / data.totalAmount) * 100 : 0,
            customerSince: data.customerSince,
          }))
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 10)

        // Customers by product
        const productTotals: { [key: string]: { customerSet: Set<string>; totalRevenue: number } } = {}
        sales.forEach((sale: any) => {
          const product = sale.product_type
          if (!productTotals[product]) {
            productTotals[product] = { customerSet: new Set(), totalRevenue: 0 }
          }
          productTotals[product].customerSet.add(sale.customer_name || "Unknown")
          productTotals[product].totalRevenue += sale.sale_amount || 0
        })

        const customersByProduct = Object.entries(productTotals).map(([product, data]) => ({
          product,
          customerCount: data.customerSet.size,
          totalRevenue: data.totalRevenue,
          averageRevenue: data.customerSet.size > 0 ? data.totalRevenue / data.customerSet.size : 0,
        }))

        // Loyalty analysis
        const loyaltySegments = [
          { segment: "VIP", min: 10, max: Infinity },
          { segment: "Loyal", min: 5, max: 9 },
          { segment: "Regular", min: 2, max: 4 },
          { segment: "New", min: 1, max: 1 },
        ]

        const loyaltyAnalysis = loyaltySegments.map(({ segment, min, max }) => {
          const segmentCustomers = topCustomers.filter(c => 
            c.transactionCount >= min && c.transactionCount <= max
          )
          const totalRevenue = segmentCustomers.reduce((sum, c) => sum + c.totalAmount, 0)
          const averageLifetimeValue = segmentCustomers.length > 0 ? totalRevenue / segmentCustomers.length : 0
          const retentionRate = segmentCustomers.filter(c => 
            new Date(c.lastTransaction) > new Date(Date.now() - 90*24*60*60*1000)
          ).length / Math.max(segmentCustomers.length, 1)

          return {
            segment,
            customerCount: segmentCustomers.length,
            totalRevenue,
            averageLifetimeValue,
            retentionRate,
          }
        })

        // Customer retention
        const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000)
        const returningCustomers = topCustomers.filter(c => 
          c.transactionCount > 1 && new Date(c.lastTransaction) > thirtyDaysAgo
        ).length
        const newCustomers = topCustomers.filter(c => 
          c.transactionCount === 1 && new Date(c.customerSince) > thirtyDaysAgo
        ).length
        
        const customerRetention = {
          returning: returningCustomers,
          new: newCustomers,
          total: topCustomers.length,
          retentionRate: topCustomers.length > 0 ? returningCustomers / topCustomers.length : 0,
        }

        // Monthly acquisition
        const months: string[] = []
        const monthMap: { [key: string]: { customerSet: Set<string>; revenue: number } } = {}
        const start = new Date(startDate)
        const end = new Date(endDate)
        let d = new Date(start.getFullYear(), start.getMonth(), 1)
        while (d <= end) {
          const monthName = d.toLocaleDateString("en-US", { month: "short" })
          months.push(monthName)
          monthMap[monthName] = { customerSet: new Set(), revenue: 0 }
          d.setMonth(d.getMonth() + 1)
        }
        sales.forEach((sale: any) => {
          const date = new Date(sale.transaction_date)
          const monthName = date.toLocaleDateString("en-US", { month: "short" })
          if (monthMap[monthName]) {
            monthMap[monthName].customerSet.add(sale.customer_name || "Unknown")
            monthMap[monthName].revenue += sale.sale_amount || 0
          }
        })
        const monthlyAcquisition = months.map((month) => ({
          month,
          newCustomers: monthMap[month].customerSet.size,
          revenue: monthMap[month].revenue,
          averageValue: monthMap[month].customerSet.size > 0 ? monthMap[month].revenue / monthMap[month].customerSet.size : 0,
        }))

        setReportData({
          totalCustomers,
          totalRevenue,
          averageRevenuePerCustomer,
          topCustomers,
          customersByProduct,
          loyaltyAnalysis,
          monthlyAcquisition,
          customerRetention,
          geographicDistribution: [], // Placeholder - would need geographic data
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
            ["Total Revenue", formatCurrencyForExport(reportData.totalRevenue)],
            ["Total Expenses", formatCurrencyForExport(reportData.totalExpenses)],
            ["Net Profit", formatCurrencyForExport(reportData.netProfit)],
            ["Profit Margin", `${reportData.profitMargin.toFixed(2)}%`],
            ["Total Transactions", reportData.totalTransactions],
            ["Avg Transaction Value", formatCurrencyForExport(reportData.averageTransactionValue)],
          ],
        })
        doc.save("financial-summary-report.pdf")
      } else if (format === "csv" || format === "excel") {
        const rows = [
          ["Metric", "Value"],
          ["Total Revenue", formatCurrencyForExport(reportData.totalRevenue)],
          ["Total Expenses", formatCurrencyForExport(reportData.totalExpenses)],
          ["Net Profit", formatCurrencyForExport(reportData.netProfit)],
          ["Profit Margin", `${reportData.profitMargin.toFixed(2)}%`],
          ["Total Transactions", reportData.totalTransactions],
          ["Avg Transaction Value", formatCurrencyForExport(reportData.averageTransactionValue)],
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
    } else if (filters.reportType === "sales") {
      // Sales Report Export
      const salesRows = reportData.sales.map((sale: any) => [
        sale.transaction_date,
        sale.customer_name,
        sale.product_type,
        formatCurrencyForExport(sale.sale_amount),
        formatCurrencyForExport(sale.profit_loss || 0),
        sale.payment_status,
        sale.vendor || '-',
      ])
      const headers = [
        "Date",
        "Customer",
        "Product",
        "Amount",
        "Profit",
        "Status",
        "Vendor",
      ]
      const productTypeSuffix = filters.productType !== "all" ? `-${filters.productType.replace(/\s+/g, '-')}` : ""
      
      if (format === "pdf") {
        const doc = new jsPDF()
        doc.text("Sales Report", 14, 16)
        if (filters.productType !== "all") {
          doc.text(`Product Type: ${filters.productType}`, 14, 22)
          doc.text(`Date Range: ${getDateRangeLabel()}`, 14, 28)
        } else {
          doc.text(`Date Range: ${getDateRangeLabel()}`, 14, 22)
        }
        autoTable(doc, {
          startY: filters.productType !== "all" ? 34 : 28,
          head: [headers],
          body: salesRows,
        })
        doc.save(`sales-report${productTypeSuffix}.pdf`)
      } else if (format === "csv" || format === "excel") {
        const allRows = [headers, ...salesRows]
        if (format === "csv") {
          const csv = Papa.unparse(allRows)
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `sales-report${productTypeSuffix}.csv`
          a.click()
          URL.revokeObjectURL(url)
        } else {
          const ws = XLSX.utils.aoa_to_sheet(allRows)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Sales")
          const productSuffix = filters.productType && filters.productType !== "all" ? `-${filters.productType.toLowerCase().replace(/\s+/g, '-')}` : ''
          XLSX.writeFile(wb, `sales-report${productSuffix}.xlsx`)
        }
      }
    } else if (filters.reportType === "profit-loss") {
      // Profit & Loss Report Export
      const plRows = [
        ["REVENUE", ""],
        ...reportData.revenueByProduct.map((item: any) => [item.product, formatCurrencyForExport(item.amount)]),
        ["Total Revenue", formatCurrencyForExport(reportData.totalRevenue)],
        ["", ""],
        ["EXPENSES", ""],
        ...reportData.expensesByCategory.map((item: any) => [item.category, formatCurrencyForExport(item.amount)]),
        ["Total Expenses", formatCurrencyForExport(reportData.totalExpenses)],
        ["", ""],
        ["PROFIT", ""],
        ["Gross Profit", formatCurrencyForExport(reportData.grossProfit)],
        ["Net Profit", formatCurrencyForExport(reportData.netProfit)],
        ["Profit Margin", `${reportData.profitMargin.toFixed(2)}%`],
      ]
      const headers = ["Item", "Amount"]
      
      if (format === "pdf") {
        const doc = new jsPDF()
        doc.text("Profit & Loss Statement", 14, 16)
        doc.text(`Date Range: ${getDateRangeLabel()}`, 14, 24)
        autoTable(doc, {
          startY: 30,
          head: [headers],
          body: plRows,
        })
        doc.save("profit-loss-report.pdf")
      } else if (format === "csv" || format === "excel") {
        const allRows = [headers, ...plRows]
        if (format === "csv") {
          const csv = Papa.unparse(allRows)
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = "profit-loss-report.csv"
          a.click()
          URL.revokeObjectURL(url)
        } else {
          const ws = XLSX.utils.aoa_to_sheet(allRows)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "ProfitLoss")
          XLSX.writeFile(wb, "profit-loss-report.xlsx")
        }
      }
    } else if (filters.reportType === "cash-flow") {
      // Cash Flow Report Export
      const cfRows = [
        ["Opening Balance", formatCurrencyForExport(reportData.openingBalance)],
        ["", ""],
        ["CASH INFLOWS", ""],
        ...reportData.cashInflows.map((item: any) => [item.source, formatCurrencyForExport(item.amount)]),
        ["Total Inflows", formatCurrencyForExport(reportData.totalInflow)],
        ["", ""],
        ["CASH OUTFLOWS", ""],
        ...reportData.cashOutflows.map((item: any) => [item.category, formatCurrencyForExport(item.amount)]),
        ["Total Outflows", formatCurrencyForExport(reportData.totalOutflow)],
        ["", ""],
        ["Net Cash Flow", formatCurrencyForExport(reportData.netCashFlow)],
        ["Closing Balance", formatCurrencyForExport(reportData.closingBalance)],
      ]
      const headers = ["Item", "Amount"]
      
      if (format === "pdf") {
        const doc = new jsPDF()
        doc.text("Cash Flow Statement", 14, 16)
        doc.text(`Date Range: ${getDateRangeLabel()}`, 14, 24)
        autoTable(doc, {
          startY: 30,
          head: [headers],
          body: cfRows,
        })
        doc.save("cash-flow-report.pdf")
      } else if (format === "csv" || format === "excel") {
        const allRows = [headers, ...cfRows]
        if (format === "csv") {
          const csv = Papa.unparse(allRows)
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = "cash-flow-report.csv"
          a.click()
          URL.revokeObjectURL(url)
        } else {
          const ws = XLSX.utils.aoa_to_sheet(allRows)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "CashFlow")
          XLSX.writeFile(wb, "cash-flow-report.xlsx")
        }
      }
    } else if (filters.reportType === "vendor-analysis") {
      // Vendor Analysis Report Export
      const vendorRows = reportData.topVendors.map((vendor: any) => [
        vendor.name,
        vendor.category,
        formatCurrencyForExport(vendor.totalAmount),
        vendor.transactionCount,
        formatCurrencyForExport(vendor.averageTransaction),
        vendor.lastTransaction,
      ])
      const headers = [
        "Vendor Name",
        "Category",
        "Total Amount",
        "Transactions",
        "Avg Transaction",
        "Last Transaction",
      ]
      
      if (format === "pdf") {
        const doc = new jsPDF()
        doc.text("Vendor Analysis Report", 14, 16)
        doc.text(`Date Range: ${getDateRangeLabel()}`, 14, 24)
        autoTable(doc, {
          startY: 30,
          head: [headers],
          body: vendorRows,
        })
        doc.save("vendor-analysis-report.pdf")
      } else if (format === "csv" || format === "excel") {
        const allRows = [headers, ...vendorRows]
        if (format === "csv") {
          const csv = Papa.unparse(allRows)
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = "vendor-analysis-report.csv"
          a.click()
          URL.revokeObjectURL(url)
        } else {
          const ws = XLSX.utils.aoa_to_sheet(allRows)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "VendorAnalysis")
          XLSX.writeFile(wb, "vendor-analysis-report.xlsx")
        }
      }
    } else if (filters.reportType === "customer-analysis") {
      // Customer Analysis Report Export
      const customerRows = reportData.topCustomers.map((customer: any) => [
        customer.name,
        customer.email,
        customer.phone,
        formatCurrencyForExport(customer.totalAmount),
        customer.transactionCount,
        formatCurrencyForExport(customer.averageTransaction),
        formatCurrencyForExport(customer.totalProfit),
        `${customer.profitMargin.toFixed(2)}%`,
        customer.customerSince,
      ])
      const headers = [
        "Customer Name",
        "Email",
        "Phone",
        "Total Amount",
        "Transactions",
        "Avg Transaction",
        "Total Profit",
        "Profit Margin",
        "Customer Since",
      ]
      
      if (format === "pdf") {
        const doc = new jsPDF()
        doc.text("Customer Analysis Report", 14, 16)
        doc.text(`Date Range: ${getDateRangeLabel()}`, 14, 24)
        autoTable(doc, {
          startY: 30,
          head: [headers],
          body: customerRows,
        })
        doc.save("customer-analysis-report.pdf")
      } else if (format === "csv" || format === "excel") {
        const allRows = [headers, ...customerRows]
        if (format === "csv") {
          const csv = Papa.unparse(allRows)
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = "customer-analysis-report.csv"
          a.click()
          URL.revokeObjectURL(url)
        } else {
          const ws = XLSX.utils.aoa_to_sheet(allRows)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "CustomerAnalysis")
          XLSX.writeFile(wb, "customer-analysis-report.xlsx")
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
          {filters.reportType === "sales" && <SalesReport data={reportData} dateRange={getDateRangeLabel()} productType={filters.productType} />}
          {filters.reportType === "profit-loss" && <ProfitLossReport data={reportData} dateRange={getDateRangeLabel()} />}
          {filters.reportType === "cash-flow" && <CashFlowReport data={reportData} dateRange={getDateRangeLabel()} />}
          {filters.reportType === "vendor-analysis" && <VendorAnalysisReport data={reportData} dateRange={getDateRangeLabel()} />}
          {filters.reportType === "customer-analysis" && <CustomerAnalysisReport data={reportData} dateRange={getDateRangeLabel()} />}
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
