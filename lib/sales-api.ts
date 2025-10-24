import { createClient } from "@/lib/supabase/server"
import type { Sale, Customer } from "@/lib/types"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@tripbooking.ai"

export async function getSales(): Promise<Sale[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("User not authenticated")

  // All users (admin + managers) see all sales records
  // Read from the view that joins sales with profiles. This avoids relying on
  // Supabase relationship names and works even when a direct FK is not present.
  const { data, error } = await supabase
    .from("sales_with_profiles")
    .select("*")
    .order("transaction_date", { ascending: false })

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("User not authenticated")

  // Both admin and manager can create sales. Ensure record is tied to the creator.
  const insertPayload = { ...sale, user_id: user.id }

  const { data, error } = await supabase.from("sales").insert(insertPayload).select().single()

  if (error) throw error
  return data
}

export async function updateSale(id: string, sale: Partial<Sale>): Promise<Sale> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("User not authenticated")

  const isAdmin = user.email === ADMIN_EMAIL
  if (!isAdmin) throw new Error("Forbidden: only admin can update sales")

  const { data, error } = await supabase
    .from("sales")
    .update({ ...sale, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(`
      *,
      profiles!sales_user_id_fkey (
        email,
        full_name
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function deleteSale(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("User not authenticated")

  const isAdmin = user.email === ADMIN_EMAIL
  if (!isAdmin) throw new Error("Forbidden: only admin can delete sales")

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

export async function findOrCreateCustomerByPhone(
  customerData: { name: string; phone: string; email?: string | null }
): Promise<Customer> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  // First, try to find existing customer by phone
  const { data: existingCustomer, error: findError } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .eq("phone", customerData.phone)
    .single()

  if (findError && findError.code !== "PGRST116") {
    // PGRST116 is "not found" error, other errors should be thrown
    throw findError
  }

  if (existingCustomer) {
    // Update existing customer's name and email if provided
    const { data: updatedCustomer, error: updateError } = await supabase
      .from("customers")
      .update({
        name: customerData.name,
        email: customerData.email,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingCustomer.id)
      .select()
      .single()

    if (updateError) throw updateError
    return updatedCustomer
  }

  // Create new customer if not found
  const { data: newCustomer, error: createError } = await supabase
    .from("customers")
    .insert({
      user_id: user.id,
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email
    })
    .select()
    .single()

  if (createError) throw createError
  return newCustomer
}
