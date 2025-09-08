"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Search, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import type { Expense, ExpenseCategory } from "@/lib/types"


interface ExpenseListProps {
  expenses: Expense[]
  categories: ExpenseCategory[]
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseList({ expenses, categories, onEdit, onDelete }: ExpenseListProps) {

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [viewExpense, setViewExpense] = useState<Expense | null>(null)

  const filteredExpenses = expenses.filter((expense: Expense) => {
    const matchesSearch =
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || expense.approval_status === statusFilter
    const matchesCategory = categoryFilter === "all" || expense.category_id === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

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

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized"
  const category = categories.find((cat: ExpenseCategory) => cat.id === categoryId)
    return category?.name || "Unknown"
  }

  const totalAmount = filteredExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Expense Records</CardTitle>
            <CardDescription>Manage and track all business expenses</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold text-primary">
              ৳{totalAmount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by vendor, notes, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories
                .filter((cat) => cat.parent_id)
                .map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expenses Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid Through</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No expenses found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{new Date(expense.date).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell>
                      <div className="text-sm">{getCategoryName(expense.category_id)}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expense.vendor || "N/A"}</div>
                        {expense.reference_number && (
                          <div className="text-xs text-muted-foreground">Ref: {expense.reference_number}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ৳{expense.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      {expense.tax_amount > 0 && (
                        <div className="text-xs text-muted-foreground">+৳{expense.tax_amount.toFixed(2)} tax</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {expense.paid_through}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getStatusColor(expense.approval_status)}`}>
                        {expense.approval_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setViewExpense(expense)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onEdit(expense)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onDelete(expense.id)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
      {/* View Expense Modal */}
      <Dialog open={!!viewExpense} onOpenChange={() => setViewExpense(null)}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-0">
          <DialogHeader className="sticky top-0 z-10 bg-white p-6 border-b">
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {viewExpense && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {Object.entries(viewExpense)
                  .filter(([key, value]) =>
                    value !== null && value !== undefined && value !== "" && value !== false && key !== "id" && key !== "user_id" && key !== "category_id" && key !== "attachment_urls"
                  )
                  .map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1 border-b pb-2 last:border-b-0">
                      <span className="font-semibold text-gray-700 capitalize text-xs tracking-wide">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-base text-gray-900 break-all">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                      </span>
                    </div>
                  ))}
                {/* Multiple Attachments preview/download */}
                {Array.isArray(viewExpense.attachment_urls) && viewExpense.attachment_urls.length > 0 && (
                  <div className="flex flex-col gap-1 border-b pb-2 last:border-b-0">
                    <span className="font-semibold text-gray-700 capitalize text-xs tracking-wide">Attachments</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {viewExpense.attachment_urls.map((url: string, idx: number) => (
                        <div key={url} className="flex flex-col items-center">
                          {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <img src={url} alt={`Attachment ${idx+1}`} className="w-20 h-20 object-contain rounded border mb-1" />
                          ) : (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 mb-1">File {idx+1}</a>
                          )}
                          <a href={url} download className="text-xs text-blue-500 underline">Download</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogClose asChild>
            <Button className="mt-4 w-full rounded-b-lg">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredExpenses.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </div>
        )}
      </CardContent>
    </Card>
  )
}
