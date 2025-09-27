import { createClient } from "@/lib/supabase/client"
import type { Customer } from "@/lib/types"

export async function findOrCreateCustomerByPhoneClient(
  customerData: { name: string; phone: string; email?: string | null }
): Promise<Customer> {
  const supabase = createClient()
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