export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("customers").select("*").order("name")
  if (error) throw error
  return data || []
}
import { createClient } from "@/lib/supabase/client"
import type { Expense, ExpenseCategory, Vendor, Customer } from "@/lib/types"

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("expense_categories").select("*").order("name")

  if (error) throw error
  return data || []
}

export async function getExpenses(): Promise<Expense[]> {
  const supabase = await createClient()
  // Explicitly select attachment_urls
  const { data, error } = await supabase.from("expenses").select("*, attachment_urls").order("date", { ascending: false })
  if (error) throw error
  return data || []
}

export async function createExpense(expense: Omit<Expense, "id" | "created_at" | "updated_at">): Promise<Expense> {
  const supabase = await createClient()
  // Ensure attachment_urls is included
  const { data, error } = await supabase.from("expenses").insert(expense).select("*, attachment_urls").single()
  if (error) throw error
  return data
}

export async function updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expenses")
    .update({ ...expense, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, attachment_urls")
    .single()
  if (error) throw error
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("expenses").delete().eq("id", id)

  if (error) throw error
}

export async function getVendors(): Promise<Vendor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("vendors").select("*").order("name")

  if (error) throw error
  return data || []
}

// getCustomers is defined below, remove duplicate here
