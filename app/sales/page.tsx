"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SalesForm } from "@/components/sales-form"
import { SalesList } from "@/components/sales-list"
import type { Sale, Customer, Vendor } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
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

      // Load sales with creator profile information (from view)
      const { data: salesData, error: salesError } = await supabase
        .from("sales_with_profiles")
        .select("*")
        .order("transaction_date", { ascending: false })

      if (salesError) {
        console.error("Sales error:", salesError)
        throw salesError
      }
      setSales(salesData || [])

      // Load customers
      const { data: customersData, error: customersError } = await supabase.from("customers").select("*").order("name")

      if (customersError) throw customersError
      setCustomers(customersData || [])

      // Load vendors
      const { data: vendorsData, error: vendorsError } = await supabase.from("vendors").select("*").order("name")

      if (vendorsError) throw vendorsError
      setVendors(vendorsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (
    saleData: Omit<
      Sale,
      "id" | "created_at" | "updated_at" | "profit_loss" | "profit_margin" | "outstanding_balance"
    >,
  ) => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Customer ID should already be handled by the form using findOrCreateCustomerByPhone
      if (editingSale) {
        // Update existing sale
        const { data, error } = await supabase
          .from("sales")
          .update({ ...saleData, updated_at: new Date().toISOString() })
          .eq("id", editingSale.id)
          .select()
          .single()

        if (error) throw error

        setSales((prev) => prev.map((sale) => (sale.id === editingSale.id ? data : sale)))
      } else {
        // Create new sale
  const { data, error } = await supabase.from("sales").insert(saleData).select().single()

        if (error) throw error

        setSales((prev) => [data, ...prev])
      }

      setShowForm(false)
      setEditingSale(null)
    } catch (error) {
      console.error("Error saving sale:", error)
    }
  }

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("sales").delete().eq("id", id)

      if (error) throw error

      setSales((prev) => prev.filter((sale) => sale.id !== id))
    } catch (error) {
      console.error("Error deleting sale:", error)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingSale(null)
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-balance">Sales Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage air tickets, hotels, and tour package sales with profit tracking
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Sale
          </Button>
        )}
      </div>

      {showForm ? (
        <SalesForm
          customers={customers}
          vendors={vendors}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={editingSale || undefined}
        />
      ) : (
        <SalesList sales={sales} customers={customers} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  )
}
