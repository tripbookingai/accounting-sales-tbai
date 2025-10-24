import { createClient } from "@/lib/supabase/server"
import type { Expense, ExpenseCategory, Vendor, Customer } from "@/lib/types"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@tripbooking.ai"

async function ensureAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")
  if (user.email !== ADMIN_EMAIL) throw new Error("Forbidden: admin only")
  return user
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient()
  await ensureAdmin(supabase)
  const { data, error } = await supabase.from("expense_categories").select("*").order("name")

  if (error) throw error
  return data || []
}

export async function getExpenses(): Promise<Expense[]> {
  const supabase = await createClient()
  await ensureAdmin(supabase)
  // Explicitly select attachment_urls
  const { data, error } = await supabase.from("expenses").select("*, attachment_urls").order("date", { ascending: false })
  if (error) throw error
  return data || []
}

export async function createExpense(expense: Omit<Expense, "id" | "created_at" | "updated_at">): Promise<Expense> {
  const supabase = await createClient()
  await ensureAdmin(supabase)
  // Ensure attachment_urls is included
  const { data, error } = await supabase.from("expenses").insert(expense).select("*, attachment_urls").single()
  if (error) throw error
  return data
}

export async function updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
  const supabase = await createClient()
  await ensureAdmin(supabase)
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
  await ensureAdmin(supabase)
  const { error } = await supabase.from("expenses").delete().eq("id", id)

  if (error) throw error
}

export async function getVendors(): Promise<Vendor[]> {
  const supabase = await createClient()
  await ensureAdmin(supabase)
  const { data, error } = await supabase.from("vendors").select("*").order("name")

  if (error) throw error
  return data || []
}

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient()
  await ensureAdmin(supabase)
  const { data, error } = await supabase.from("customers").select("*").order("name")
  if (error) throw error
  return data || []
}
