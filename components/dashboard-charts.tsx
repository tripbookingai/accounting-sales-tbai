"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

interface ExpenseByCategory {
  name: string
  value: number
  color: string
}

interface MonthlyData {
  month: string
  expenses: number
  sales: number
  profit: number
}

interface SalesByProduct {
  name: string
  value: number
  color: string
}


interface DashboardChartsProps {
  expensesByCategory: ExpenseByCategory[]
  monthlyData: MonthlyData[]
  salesByProduct: SalesByProduct[]
  topVendors?: { name: string; value: number; color: string }[]
  topCustomers?: { name: string; value: number; color: string }[]
  expenseTrendsByCategory?: any[]
  salesTrendsByProduct?: any[]
}

export function DashboardCharts({
  expensesByCategory,
  monthlyData,
  salesByProduct,
  topVendors = [],
  topCustomers = [],
  expenseTrendsByCategory = [],
  salesTrendsByProduct = [],
}: DashboardChartsProps) {
  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f97316", "#ef4444", "#8b5cf6"]

  // Helper to get color for dynamic lines/bars
  const getColor = (idx: number) => COLORS[idx % COLORS.length]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Expenses by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>Breakdown of expenses by main categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${name}: ৳${value.toLocaleString('en-BD')}`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sales by Product Type */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Product Type</CardTitle>
          <CardDescription>Revenue distribution across product categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByProduct}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number, name: string) => [`${name}: ৳${value.toLocaleString('en-BD')}`]} />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Vendors by Expense */}
      <Card>
        <CardHeader>
          <CardTitle>Top Vendors by Expense</CardTitle>
          <CardDescription>Vendors with the highest expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVendors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value: number, name: string) => [`${name}: ৳${value.toLocaleString('en-BD')}`]} />
                <Bar dataKey="value">
                  {topVendors.map((entry, idx) => (
                    <Cell key={`vendor-bar-${idx}`} fill={getColor(idx)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers by Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Sales</CardTitle>
          <CardDescription>Customers with the highest sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value: number, name: string) => [`${name}: ৳${value.toLocaleString('en-BD')}`]} />
                <Bar dataKey="value">
                  {topCustomers.map((entry, idx) => (
                    <Cell key={`customer-bar-${idx}`} fill={getColor(idx)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Financial Trends</CardTitle>
          <CardDescription>Track expenses, sales, and profit over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number, name: string) => [`${name}: ৳${value.toLocaleString('en-BD')}`]} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Sales" />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Expense Trends by Category */}
      {expenseTrendsByCategory && expenseTrendsByCategory.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Expense Trends by Category</CardTitle>
            <CardDescription>Monthly expense trends for each category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={expenseTrendsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number, name: string) => [`${name}: ৳${value.toLocaleString('en-BD')}`]} />
                  {Object.keys(expenseTrendsByCategory[0] || {})
                    .filter((k) => k !== "month")
                    .map((cat, idx) => (
                      <Line
                        key={cat}
                        type="monotone"
                        dataKey={cat}
                        stroke={getColor(idx)}
                        strokeWidth={2}
                        name={cat}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Trends by Product Type */}
      {salesTrendsByProduct && salesTrendsByProduct.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Trends by Product Type</CardTitle>
            <CardDescription>Monthly sales trends for each product type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendsByProduct}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number, name: string) => [`${name}: ৳${value.toLocaleString('en-BD')}`]} />
                  {Object.keys(salesTrendsByProduct[0] || {})
                    .filter((k) => k !== "month")
                    .map((prod, idx) => (
                      <Line
                        key={prod}
                        type="monotone"
                        dataKey={prod}
                        stroke={getColor(idx)}
                        strokeWidth={2}
                        name={prod}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
