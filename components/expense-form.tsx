"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getVendors, getCustomers } from "@/lib/expense-api"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Upload } from "lucide-react"
import type { ExpenseCategory, Expense } from "@/lib/types"

// Helper to upload file to local API
async function uploadAttachment(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.url as string;
}

interface ExpenseFormProps {
  categories: ExpenseCategory[]
  onSubmit: (expense: Omit<Expense, "id" | "created_at" | "updated_at">) => void
  onCancel?: () => void
  initialData?: Expense
}

export function ExpenseForm({ categories, onSubmit, onCancel, initialData }: ExpenseFormProps) {
  // Find initial main category and subcategories if editing
  let initialMainCategory = ""
  let initialSubcategories: ExpenseCategory[] = []
  if (initialData?.category_id && categories.length > 0) {
    const subcat = categories.find(cat => cat.id === initialData.category_id)
    if (subcat && subcat.parent_id) {
      initialMainCategory = subcat.parent_id
      initialSubcategories = categories.filter(cat => cat.parent_id === subcat.parent_id)
    }
  }

  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split("T")[0],
    category_id: initialData?.category_id || "",
    amount: initialData?.amount?.toString() || "",
    currency: initialData?.currency || "BDT",
    paid_through: initialData?.paid_through || "",
    tax_amount: initialData?.tax_amount?.toString() || "0",
    tax_percentage: initialData?.tax_percentage?.toString() || "0",
    vendor: initialData?.vendor || "",
    reference_number: initialData?.reference_number || "",
    notes: initialData?.notes || "",
    customer_name: initialData?.customer_name || "",
    approval_status: initialData?.approval_status || "Pending",
    tags: initialData?.tags || [],
  })

  const [newTag, setNewTag] = useState("")
  const [selectedMainCategory, setSelectedMainCategory] = useState(initialMainCategory)
  const [subcategories, setSubcategories] = useState<ExpenseCategory[]>(initialSubcategories)
  // ...existing code...

  // When editing, set main and subcategory fields based on initialData (only once)
  // Only update on initialData/category change, not on every render
  useEffect(() => {
    if (initialData && initialData.category_id && categories.length > 0) {
      const subcat = categories.find(cat => cat.id === initialData.category_id)
      if (subcat && subcat.parent_id) {
        setSelectedMainCategory(subcat.parent_id)
        setSubcategories(categories.filter(cat => cat.parent_id === subcat.parent_id))
        setFormData(prev => ({ ...prev, category_id: subcat.id }))
      } else {
        setSelectedMainCategory("")
        setSubcategories([])
      }
    }
    // Only run this effect once when initialData and categories are loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, categories])

  // When main category changes, update subcategories and reset subcategory if needed
  useEffect(() => {
    if (selectedMainCategory) {
      const subs = categories.filter((cat) => cat.parent_id === selectedMainCategory)
      setSubcategories(subs)
      // If current subcategory is not in the new subcategories, reset it
      if (!subs.some(cat => cat.id === formData.category_id)) {
        setFormData(prev => ({ ...prev, category_id: "" }))
      }
    } else {
      setSubcategories([])
      setFormData(prev => ({ ...prev, category_id: "" }))
    }
  }, [selectedMainCategory, categories])
  const [vendors, setVendors] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [vendorQuery, setVendorQuery] = useState("")
  const [customerQuery, setCustomerQuery] = useState("")
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [taxMode, setTaxMode] = useState<'percentage' | 'fixed'>("percentage")
  const [attachments, setAttachments] = useState<File[]>([])
  // For editing, store existing URLs
  const [existingAttachments, setExistingAttachments] = useState<string[]>(initialData?.attachment_urls || [])
  const suggestedTags = ["Project", "Department", "Client", "Reimbursed", "Internal", "External", "Team", "Marketing Channel"]

  const mainCategories = categories.filter((cat) => !cat.parent_id)

  useEffect(() => {
    if (selectedMainCategory) {
      const subs = categories.filter((cat) => cat.parent_id === selectedMainCategory)
      setSubcategories(subs)
    } else {
      setSubcategories([])
    }
  }, [selectedMainCategory, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Always get the authenticated user's UUID
    const supabase = await import("@/lib/supabase/client").then(m => m.createClient());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to create an expense.");
      return;
    }
    const user_id = user.id;
    // Upload new files
    let uploadedUrls: string[] = [];
    for (const file of attachments) {
      const url = await uploadAttachment(file);
      if (url) uploadedUrls.push(url);
    }
    // Combine with existing (if editing)
    const allUrls = [...existingAttachments, ...uploadedUrls];
    const expenseData = {
      user_id,
      date: formData.date,
      category_id: formData.category_id || null,
      amount: Number.parseFloat(formData.amount),
      currency: formData.currency,
      paid_through: formData.paid_through as any,
      tax_amount: Number.parseFloat(formData.tax_amount),
      tax_percentage: Number.parseFloat(formData.tax_percentage),
      vendor: formData.vendor || null,
      reference_number: formData.reference_number || null,
      notes: formData.notes || null,
      customer_name: formData.customer_name || null,
      attachment_urls: allUrls,
      approval_status: formData.approval_status as any,
      tags: formData.tags,
    };
    onSubmit(expenseData);
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{initialData ? "Edit Expense" : "Add New Expense"}</CardTitle>
        <CardDescription>Enter expense details for accurate financial tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BDT) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            {/* Main Category */}
            <div className="space-y-2">
              <Label htmlFor="main-category">Main Category</Label>
              <Select value={selectedMainCategory} onValueChange={setSelectedMainCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select main category" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory */}
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
                disabled={!selectedMainCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Paid Through */}
            <div className="space-y-2">
              <Label htmlFor="paid-through">Paid Through *</Label>
              <Select
                value={formData.paid_through}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, paid_through: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company">Company</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Mobile Wallet">Mobile Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tax Percentage */}
            <div className="space-y-2">
              <Label htmlFor="tax-percentage">Tax (%)</Label>
              <Input
                id="tax-percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                value={formData.tax_percentage}
                onChange={(e) => setFormData((prev) => ({ ...prev, tax_percentage: e.target.value }))}
              />
            </div>

            {/* Vendor */}
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                placeholder="Enter vendor name"
                value={formData.vendor}
                onChange={(e) => setFormData((prev) => ({ ...prev, vendor: e.target.value }))}
              />
            </div>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="reference">Reference #</Label>
              <Input
                id="reference"
                placeholder="Invoice/Receipt number"
                value={formData.reference_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, reference_number: e.target.value }))}
              />
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customer">Customer Name</Label>
              <Input
                id="customer"
                placeholder="Client name (if applicable)"
                value={formData.customer_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, customer_name: e.target.value }))}
              />
            </div>

            {/* Approval Status */}
            <div className="space-y-2">
              <Label htmlFor="approval-status">Approval Status</Label>
              <Select
                value={formData.approval_status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, approval_status: value as "Paid" | "Pending" | "Approved" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or explanations"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Tags with suggestions */}
          <div className="space-y-2">
            <Label>Reporting Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={formData.tags.includes(tag) ? "default" : "secondary"}
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => {
                    if (!formData.tags.includes(tag)) {
                      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
                    }
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add tag (e.g., Project, Department, Client)"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => setAttachments(e.target.files ? Array.from(e.target.files) : [])}
            />
            {attachments.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Selected: {attachments.map(f => f.name).join(', ')}
              </div>
            )}
            {/* Show existing attachments if editing */}
            {existingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {existingAttachments.map((url, idx) => (
                  <div key={url} className="flex items-center gap-1 border rounded px-2 py-1 bg-gray-50">
                    {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <img src={url} alt="Attachment" className="w-10 h-10 object-contain rounded" />
                    ) : (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">File {idx+1}</a>
                    )}
                    <button type="button" className="ml-1 text-red-500" onClick={() => setExistingAttachments(existingAttachments.filter(u => u !== url))}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              {initialData ? "Update Expense" : "Add Expense"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
