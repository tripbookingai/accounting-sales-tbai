"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle, Database } from "lucide-react"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import type { Expense, ExpenseCategory } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [tablesExist, setTablesExist] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
    }
  }

  const loadData = async () => {
    try {
      const supabase = createClient()

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("expense_categories")
        .select("*")
        .order("name")

      if (categoriesError) {
        if (categoriesError.message.includes("does not exist") || categoriesError.message.includes("schema cache")) {
          setTablesExist(false)
          setError("Database tables not found. Please run the SQL scripts to set up the database.")
          return
        }
        throw categoriesError
      }
      setCategories(categoriesData || [])

      // Load expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false })

      if (expensesError) {
        if (expensesError.message.includes("does not exist") || expensesError.message.includes("schema cache")) {
          setTablesExist(false)
          setError("Database tables not found. Please run the SQL scripts to set up the database.")
          return
        }
        throw expensesError
      }
      setExpenses(expensesData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      setError(error instanceof Error ? error.message : "An error occurred while loading data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (expenseData: Omit<Expense, "id" | "created_at" | "updated_at">) => {
    try {
      const supabase = createClient()

      if (editingExpense) {
        // Update existing expense
        const { data, error } = await supabase
          .from("expenses")
          .update({ ...expenseData, updated_at: new Date().toISOString() })
          .eq("id", editingExpense.id)
          .select()
          .single()

        if (error) throw error

        setExpenses((prev) => prev.map((exp) => (exp.id === editingExpense.id ? data : exp)))
      } else {
        // Create new expense
        const { data, error } = await supabase.from("expenses").insert(expenseData).select().single()

        if (error) throw error

        setExpenses((prev) => [data, ...prev])
      }

      setShowForm(false)
      setEditingExpense(null)
    } catch (error) {
      console.error("Error saving expense:", error)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("expenses").delete().eq("id", id)

      if (error) throw error

      setExpenses((prev) => prev.filter((exp) => exp.id !== id))
    } catch (error) {
      console.error("Error deleting expense:", error)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingExpense(null)
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

  if (!tablesExist) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Expense Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage all your business expenses efficiently</p>
        </div>

        <Alert>
          <Database className="h-4 w-4" />
          <AlertTitle>Database Setup Required</AlertTitle>
          <AlertDescription>
            The expense management tables haven't been created yet. Please run the following SQL scripts in order:
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Required SQL Scripts
            </CardTitle>
            <CardDescription>Run these scripts in your Supabase SQL editor or using the script runner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Create Expense Categories</h4>
              <code className="block p-2 bg-muted rounded text-sm">scripts/002_create_expense_categories.sql</code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">2. Create Expense Subcategories</h4>
              <code className="block p-2 bg-muted rounded text-sm">scripts/003_create_expense_subcategories.sql</code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">3. Create Expenses Table</h4>
              <code className="block p-2 bg-muted rounded text-sm">scripts/004_create_expenses_table.sql</code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">4. Create Vendors Table</h4>
              <code className="block p-2 bg-muted rounded text-sm">scripts/006_create_vendors_table.sql</code>
            </div>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Refresh Page After Running Scripts
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && tablesExist) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Expense Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage all your business expenses efficiently</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button onClick={loadData}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-balance">Expense Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage all your business expenses efficiently</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        )}
      </div>

      {showForm ? (
        <ExpenseForm
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={editingExpense || undefined}
        />
      ) : (
        <ExpenseList expenses={expenses} categories={categories} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  )
}
