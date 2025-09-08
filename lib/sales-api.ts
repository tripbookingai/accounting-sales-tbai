import { createClient } from "@/lib/supabase/server"
import type { Sale, Customer } from "@/lib/types"

export async function getSales(): Promise<Sale[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("sales").select("*").order("transaction_date", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createSale(
  sale: Omit<
    Sale,
    "id" | "created_at" | "updated_at" | "profit_loss" | "profit_margin" | "outstanding_balance" | "nights"
  >,
): Promise<Sale> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("sales").insert(sale).select().single()

  if (error) throw error
  return data
}

export async function updateSale(id: string, sale: Partial<Sale>): Promise<Sale> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales")
    .update({ ...sale, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSale(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("sales").delete().eq("id", id)

  if (error) throw error
}

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("customers").select("*").order("name")

  if (error) throw error
  return data || []
}

export async function createCustomer(customer: Omit<Customer, "id" | "created_at" | "updated_at">): Promise<Customer> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("customers").insert(customer).select().single()

  if (error) throw error
  return data
}
