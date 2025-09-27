type SalesFormState = {
  transaction_date: string
  product_type: "Air Ticket" | "Hotel" | "Tour Package" | "Visa" | ""
  trip_type: "one_way" | "round_trip" | ""
  departure_date: string
  return_date: string
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  salesperson: string
  sale_amount: string
  cogs: string
  transaction_fee_percent: string
  payment_method: "Bank Transfer" | "Bank Card" | "Cash" | "bKash" | "Nagad" | "SSLCOMMERZ" | "" | null
  payment_received: string
  payment_status: "Paid" | "Partial" | "Pending"
  amount_paid?: string
  notes: string
  tags: string[]
  vendor: string
  booking_id: string
  flight_route: string
  number_of_passengers: string
  travel_date: string
  location: string
  checkin_date: string
  checkout_date: string
  booking_confirmation: string
  nights: string
  number_of_rooms: string
  package_name: string
  destinations: string
  duration_days: string
  start_date: string
  end_date: string
  number_of_travelers: string
  package_reference: string
  // Visa specific
  country: string
  visa_type: string
  number_of_applicants: string
  courier_fee: string
  submission_date: string
  received_date: string
  visa_status: "Pending" | "Submitted" | "Approved" | "Rejected" | "Delivered" | ""
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

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
import type { Sale, Customer, Vendor } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { findOrCreateCustomerByPhoneClient } from "@/lib/customer-client"

interface SalesFormProps {
  customers: Customer[]
  vendors: Vendor[]
  onSubmit: (
    sale: Omit<
      Sale,
      "id" | "created_at" | "updated_at" | "profit_loss" | "profit_margin" | "outstanding_balance"
    >,
  ) => void
  onCancel?: () => void
  initialData?: Sale
}

export function SalesForm({ customers, vendors, onSubmit, onCancel, initialData }: SalesFormProps) {
  // Multiple attachment state
  const [attachments, setAttachments] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<string[]>(initialData?.attachment_urls || [])
  const [formData, setFormData] = useState<SalesFormState>({
    transaction_date: initialData?.transaction_date || new Date().toISOString().split("T")[0],
    product_type: initialData?.product_type || "",
    trip_type: initialData?.trip_type || "one_way",
    departure_date: initialData?.departure_date || "",
    return_date: initialData?.return_date || "",
    customer_id: initialData?.customer_id || "",
    customer_name: initialData?.customer_name || "",
    customer_phone: initialData?.customer_phone || "",
    customer_email: initialData?.customer_email || "",
    salesperson: initialData?.salesperson || "",
    sale_amount: initialData?.sale_amount?.toString() || "",
    cogs: initialData?.cogs?.toString() || "0",
    transaction_fee_percent: initialData?.transaction_fee_percent?.toString() || "0",
    payment_method: initialData?.payment_method || "",
    payment_received: initialData?.payment_received?.toString() || "0",
    payment_status: initialData?.payment_status || "Pending",
    amount_paid:
      initialData && 'amount_paid' in initialData && initialData.amount_paid != null
        ? String(initialData.amount_paid)
        : "",
    notes: initialData?.notes || "",
    tags: initialData?.tags || [],
    vendor: initialData?.vendor || "",
    booking_id: initialData?.booking_id || "",
    flight_route: initialData?.flight_route || "",
    number_of_passengers: initialData?.number_of_passengers?.toString() || "",
    travel_date: initialData?.travel_date || "",
    location: initialData?.location || "",
    checkin_date: initialData?.checkin_date || "",
    checkout_date: initialData?.checkout_date || "",
    booking_confirmation: initialData?.booking_confirmation || "",
    nights: initialData?.nights?.toString() || "",
    number_of_rooms: initialData?.number_of_rooms?.toString() || "1",
    package_name: initialData?.package_name || "",
    destinations: initialData?.destinations || "",
    duration_days: initialData?.duration_days?.toString() || "",
    start_date: initialData?.start_date || "",
    end_date: initialData?.end_date || "",
    number_of_travelers: initialData?.number_of_travelers?.toString() || "",
    package_reference: initialData?.package_reference || "",
    // Visa specific
    country: initialData?.country || "",
    visa_type: initialData?.visa_type || "",
    number_of_applicants: initialData?.number_of_applicants?.toString() || "",
    courier_fee: initialData?.courier_fee?.toString() || "",
    submission_date: initialData?.submission_date || "",
    received_date: initialData?.received_date || "",
    visa_status: initialData?.visa_status || "",
  })

  // Auto-calculate due_amount when payment_status is Partial and amount_paid or sale_amount changes
  useEffect(() => {
  // Removed due_amount logic; Outstanding Balance is used instead
  }, [formData.payment_status, formData.amount_paid, formData.sale_amount]);
  // Product-specific fields
  // (move these back inside the useState object)
  // ...existing code...
  // ...existing code...

  // Auto-calculate nights for Hotel (rooms × nights based on check-in/out dates)
  useEffect(() => {
    if (formData.product_type === "Hotel" && formData.checkin_date && formData.checkout_date) {
      const checkin = new Date(formData.checkin_date)
      const checkout = new Date(formData.checkout_date)
      const daysDiff = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))
      // Default to 1 room if number_of_rooms is not set (for backward compatibility)
      const rooms = parseInt(formData.number_of_rooms) || 1
      const totalNights = daysDiff > 0 ? daysDiff * rooms : 0
      setFormData(prev => ({ ...prev, nights: totalNights > 0 ? totalNights.toString() : "" }))
    }
  }, [formData.product_type, formData.checkin_date, formData.checkout_date, formData.number_of_rooms])

  // Customer search state for search-as-you-type

  const [newTag, setNewTag] = useState("")
  const [calculatedProfit, setCalculatedProfit] = useState(0)
  const [calculatedMargin, setCalculatedMargin] = useState(0)
  const [calculatedFee, setCalculatedFee] = useState(0)
  const [calculatedNetProfit, setCalculatedNetProfit] = useState(0)
  const [calculatedNetMargin, setCalculatedNetMargin] = useState(0)
  const [calculatedBalance, setCalculatedBalance] = useState(0)

  // Calculate profit, margin, and balance when amounts change
  // Customer search state for search-as-you-type
  const [customerSearch, setCustomerSearch] = useState("")
  let filteredCustomers = customers
  if (customerSearch) {
    const q = customerSearch.toLowerCase()
    // Filter customers, prioritizing phone number matches
    filteredCustomers = customers.filter(c =>
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    ).sort((a, b) => {
      // Prioritize phone number matches
      const aPhoneMatch = a.phone && a.phone.toLowerCase().includes(q)
      const bPhoneMatch = b.phone && b.phone.toLowerCase().includes(q)
      if (aPhoneMatch && !bPhoneMatch) return -1
      if (!aPhoneMatch && bPhoneMatch) return 1
      return 0
    })
  }

  useEffect(() => {
    const saleAmount = Number.parseFloat(formData.sale_amount) || 0
    const cogs = Number.parseFloat(formData.cogs) || 0
    const feePercent = Number.parseFloat(formData.transaction_fee_percent) || 0
    const paymentReceived = Number.parseFloat(formData.payment_received) || 0

    const feeAmount = saleAmount * (feePercent / 100)
    const profit = saleAmount - cogs
    const netProfit = saleAmount - cogs - feeAmount
    const margin = saleAmount > 0 ? (profit / saleAmount) * 100 : 0
    const netMargin = saleAmount > 0 ? (netProfit / saleAmount) * 100 : 0
    const balance = saleAmount - paymentReceived

    setCalculatedFee(feeAmount)
    setCalculatedProfit(profit)
    setCalculatedNetProfit(netProfit)
    setCalculatedMargin(margin)
    setCalculatedNetMargin(netMargin)
    setCalculatedBalance(balance)
  }, [formData.sale_amount, formData.cogs, formData.transaction_fee_percent, formData.payment_received])

  // Auto-fill customer details when customer phone is available (prioritize phone over customer_id)
  useEffect(() => {
    if (formData.customer_phone) {
      const customer = customers.find((c) => c.phone === formData.customer_phone)
      if (customer && customer.id !== formData.customer_id) {
        setFormData((prev) => ({
          ...prev,
          customer_id: customer.id,
          customer_name: customer.name,
          customer_email: customer.email || "",
        }))
      }
    }
  }, [formData.customer_phone, customers, formData.customer_id])

  // Auto-fill customer details when customer is selected from dropdown (only if no phone number)
  useEffect(() => {
    if (formData.customer_id && !formData.customer_phone) {
      const customer = customers.find((c) => c.id === formData.customer_id)
      if (customer) {
        setFormData((prev) => ({
          ...prev,
          customer_name: customer.name,
          customer_phone: customer.phone || "",
          customer_email: customer.email || "",
        }))
      }
    }
  }, [formData.customer_id, customers, formData.customer_phone])

  // Validate customer_id matches customer_phone when editing (fix historical data issues)
  useEffect(() => {
    if (initialData && formData.customer_id && formData.customer_phone && customers.length > 0) {
      const customerById = customers.find((c) => c.id === formData.customer_id)
      const customerByPhone = customers.find((c) => c.phone === formData.customer_phone)
      
      // If customer_id points to wrong customer (phone mismatch), fix it
      if (customerById && customerByPhone && customerById.id !== customerByPhone.id) {
        console.warn('Customer ID mismatch detected, fixing using phone number:', formData.customer_phone)
        setFormData((prev) => ({
          ...prev,
          customer_id: customerByPhone.id,
          customer_name: customerByPhone.name,
          customer_email: customerByPhone.email || "",
        }))
      }
    }
  }, [initialData, formData.customer_id, formData.customer_phone, customers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Validate phone number is provided
    if (!formData.customer_phone?.trim()) {
      alert("Customer phone number is required")
      return
    }

    try {
      // Find or create customer by phone number
      const customer = await findOrCreateCustomerByPhoneClient({
        name: formData.customer_name,
        phone: formData.customer_phone,
        email: formData.customer_email || null
      })

      // Upload new files
      let uploadedUrls: string[] = [];
      for (const file of attachments) {
        const url = await uploadAttachment(file);
        if (url) uploadedUrls.push(url);
      }
      const allUrls = [...existingAttachments, ...uploadedUrls];
    const saleData = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      user_id: user.id,
      transaction_date: formData.transaction_date,
      product_type: formData.product_type as any,
      trip_type:
        formData.product_type === "Air Ticket"
          ? (formData.trip_type === "one_way" || formData.trip_type === "round_trip"
              ? formData.trip_type
              : null)
          : null,
      departure_date: formData.product_type === "Air Ticket" ? formData.departure_date : null,
      return_date: formData.product_type === "Air Ticket" && formData.trip_type === "round_trip" ? formData.return_date : null,
      customer_id: customer.id,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone || null,
      customer_email: formData.customer_email || null,
      salesperson: formData.salesperson || null,
      sale_amount: Number.parseFloat(formData.sale_amount),
      cogs: Number.parseFloat(formData.cogs),
      transaction_fee_percent: Number.parseFloat(formData.transaction_fee_percent),
      transaction_fee_amount: calculatedFee,
      // profit_loss, profit_margin, outstanding_balance are generated columns in DB
      net_profit_loss: calculatedNetProfit,
      net_profit_margin: calculatedNetMargin,
      payment_method: formData.payment_method || null,
      payment_received: Number.parseFloat(formData.payment_received),
      payment_status: formData.payment_status as any,
      amount_paid: formData.payment_status === "Partial" ? parseFloat(formData.amount_paid || "0") : null,
      notes: formData.notes || null,
      tags: formData.tags,

      // Product-specific fields
      vendor: formData.vendor || null,
      booking_id: formData.booking_id || null,

      // Air Ticket
      flight_route: formData.product_type === "Air Ticket" ? formData.flight_route || null : null,
      number_of_passengers:
        formData.product_type === "Air Ticket" ? Number.parseInt(formData.number_of_passengers) || null : null,
      travel_date: formData.product_type === "Air Ticket" ? formData.travel_date || null : null,

      // Hotel
      location: formData.product_type === "Hotel" ? formData.location || null : null,
      checkin_date: formData.product_type === "Hotel" ? formData.checkin_date || null : null,
      checkout_date: formData.product_type === "Hotel" ? formData.checkout_date || null : null,
      nights: formData.product_type === "Hotel" ? Number.parseInt(formData.nights) || null : null,
      number_of_rooms: formData.product_type === "Hotel" ? Number.parseInt(formData.number_of_rooms) || null : null,
      booking_confirmation: formData.product_type === "Hotel" ? formData.booking_confirmation || null : null,

      // Tour Package
      package_name: formData.product_type === "Tour Package" ? formData.package_name || null : null,
      destinations: formData.product_type === "Tour Package" ? formData.destinations || null : null,
      duration_days: formData.product_type === "Tour Package" ? Number.parseInt(formData.duration_days) || null : null,
      start_date: formData.product_type === "Tour Package" ? formData.start_date || null : null,
      end_date: formData.product_type === "Tour Package" ? formData.end_date || null : null,
      number_of_travelers:
        formData.product_type === "Tour Package" ? Number.parseInt(formData.number_of_travelers) || null : null,
      package_reference: formData.product_type === "Tour Package" ? formData.package_reference || null : null,

      // Visa
      country: formData.product_type === "Visa" ? formData.country || null : null,
      visa_type: formData.product_type === "Visa" ? formData.visa_type || null : null,
      number_of_applicants: formData.product_type === "Visa" ? Number.parseInt(formData.number_of_applicants) || null : null,
      courier_fee: formData.product_type === "Visa" ? Number.parseFloat(formData.courier_fee) || null : null,
      submission_date: formData.product_type === "Visa" ? formData.submission_date || null : null,
      received_date: formData.product_type === "Visa" ? formData.received_date || null : null,
      visa_status: formData.product_type === "Visa" ? formData.visa_status || null : null,

      // Attachments
      attachment_urls: allUrls,
    }

    // Find or create customer by phone number
    if (formData.customer_phone) {
      const customer = await findOrCreateCustomerByPhoneClient({
        name: formData.customer_name,
        phone: formData.customer_phone,
        email: formData.customer_email || null
      })
      saleData.customer_id = customer.id
    }
    
    onSubmit(saleData)
    } catch (error) {
      console.error("Error creating/updating customer:", error)
      alert("Error processing customer information. Please try again.")
    }
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

  const getVendorsByType = () => {
    return vendors.filter((vendor) => vendor.vendor_type === formData.product_type || !vendor.vendor_type)
  }

  const renderProductSpecificFields = () => {
    switch (formData.product_type) {
      case "Air Ticket":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="flight-route">Flight Route (From → To)</Label>
              <Input
                id="flight-route"
                placeholder="e.g., Dhaka → Dubai"
                value={formData.flight_route}
                onChange={(e) => setFormData((prev) => ({ ...prev, flight_route: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passengers">Number of Passengers</Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                placeholder="1"
                value={formData.number_of_passengers}
                onChange={(e) => setFormData((prev) => ({ ...prev, number_of_passengers: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trip-type">Trip Type</Label>
              <select
                id="trip-type"
                className="w-full border rounded px-3 py-2"
                value={formData.trip_type}
                onChange={e => setFormData(prev => ({ ...prev, trip_type: e.target.value as "one_way" | "round_trip" }))}
              >
                <option value="one_way">One Way</option>
                <option value="round_trip">Round Trip</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure-date">Departure Date</Label>
              <Input
                id="departure-date"
                type="date"
                value={formData.departure_date}
                onChange={e => setFormData(prev => ({ ...prev, departure_date: e.target.value }))}
              />
            </div>
            {formData.trip_type === "round_trip" && (
              <div className="space-y-2">
                <Label htmlFor="return-date">Return Date</Label>
                <Input
                  id="return-date"
                  type="date"
                  value={formData.return_date}
                  onChange={e => setFormData(prev => ({ ...prev, return_date: e.target.value }))}
                />
              </div>
            )}
          </>
        )

      case "Hotel":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Cox's Bazar, Dhaka"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkin">Check-in Date</Label>
              <Input
                id="checkin"
                type="date"
                value={formData.checkin_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, checkin_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout">Check-out Date</Label>
              <Input
                id="checkout"
                type="date"
                value={formData.checkout_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, checkout_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number-of-rooms">Number of Rooms</Label>
              <Input
                id="number-of-rooms"
                type="number"
                min="1"
                value={formData.number_of_rooms}
                onChange={(e) => setFormData((prev) => ({ ...prev, number_of_rooms: e.target.value }))}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nights">Total Nights (Rooms × Days)</Label>
              <Input
                id="nights"
                type="number"
                value={formData.nights}
                readOnly
                placeholder="Auto-calculated (rooms × days)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-confirmation">Booking Confirmation #</Label>
              <Input
                id="booking-confirmation"
                placeholder="Hotel booking reference"
                value={formData.booking_confirmation}
                onChange={(e) => setFormData((prev) => ({ ...prev, booking_confirmation: e.target.value }))}
              />
            </div>
          </>
        )

      case "Tour Package":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="package-name">Package Name</Label>
              <Input
                id="package-name"
                placeholder="e.g., Cox's Bazar Beach Package"
                value={formData.package_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, package_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinations">Destinations</Label>
              <Input
                id="destinations"
                placeholder="e.g., Cox's Bazar, Inani Beach"
                value={formData.destinations}
                onChange={(e) => setFormData((prev) => ({ ...prev, destinations: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Days)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="3"
                value={formData.duration_days}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration_days: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="travelers">Number of Travelers</Label>
              <Input
                id="travelers"
                type="number"
                min="1"
                placeholder="2"
                value={formData.number_of_travelers}
                onChange={(e) => setFormData((prev) => ({ ...prev, number_of_travelers: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="package-reference">Package Reference/Booking ID</Label>
              <Input
                id="package-reference"
                placeholder="Package booking reference"
                value={formData.package_reference}
                onChange={(e) => setFormData((prev) => ({ ...prev, package_reference: e.target.value }))}
              />
            </div>
          </>
        )

      case "Visa":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="e.g., Malaysia"
                value={formData.country}
                onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visa-type">Visa Type</Label>
              <Input
                id="visa-type"
                placeholder="e.g., Tourist, Student, Work"
                value={formData.visa_type}
                onChange={e => setFormData(prev => ({ ...prev, visa_type: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number-of-applicants">No. of Applicants</Label>
              <Input
                id="number-of-applicants"
                type="number"
                min="1"
                placeholder="1"
                value={formData.number_of_applicants}
                onChange={e => setFormData(prev => ({ ...prev, number_of_applicants: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courier-fee">Courier / Delivery Fee</Label>
              <Input
                id="courier-fee"
                type="number"
                min="0"
                placeholder="0.00"
                value={formData.courier_fee}
                onChange={e => setFormData(prev => ({ ...prev, courier_fee: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submission-date">Submission Date</Label>
              <Input
                id="submission-date"
                type="date"
                value={formData.submission_date}
                onChange={e => setFormData(prev => ({ ...prev, submission_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="received-date">Received Date</Label>
              <Input
                id="received-date"
                type="date"
                value={formData.received_date}
                onChange={e => setFormData(prev => ({ ...prev, received_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visa-status">Visa Status</Label>
              <select
                id="visa-status"
                className="w-full border rounded px-3 py-2"
                value={formData.visa_status}
                onChange={e => setFormData(prev => ({ ...prev, visa_status: e.target.value as SalesFormState["visa_status"] }))}
              >
                <option value="">Select status</option>
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{initialData ? "Edit Sale" : "Add New Sale"}</CardTitle>
        <CardDescription>Record sales for air tickets, hotels, and tour packages</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Sales Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="transaction-date">Transaction Date *</Label>
              <Input
                id="transaction-date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, transaction_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-type">Product Type *</Label>
              <Select
                value={formData.product_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    product_type: value as "Air Ticket" | "Hotel" | "Tour Package" | "",
                    trip_type: value === "Air Ticket" ? prev.trip_type || "one_way" : "",
                    departure_date: value === "Air Ticket" ? prev.departure_date : "",
                    return_date: value === "Air Ticket" ? prev.return_date : "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Air Ticket">Air Ticket</SelectItem>
                  <SelectItem value="Hotel">Hotel</SelectItem>
                  <SelectItem value="Tour Package">Tour Package</SelectItem>
                  <SelectItem value="Visa">Visa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <div className="relative">
                <Input
                  id="customer-search"
                  placeholder="Search customer by phone number (unique), name, or email"
                  value={formData.customer_name}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, customer_name: e.target.value }))
                    setCustomerSearch(e.target.value)
                  }}
                  autoComplete="off"
                />
                {customerSearch && (
                  <div className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-y-auto shadow-lg mt-1">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-2 text-muted-foreground text-sm">No customers found</div>
                    ) : (
                      filteredCustomers.map(customer => (
                        <div
                          key={customer.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              customer_id: customer.id,
                              customer_name: customer.name,
                              customer_phone: customer.phone || "",
                              customer_email: customer.email || "",
                            }))
                            setCustomerSearch("")
                          }}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-semibold text-blue-600">{customer.phone || "No phone"}</span>
                            {customer.email ? ` | ${customer.email}` : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name *</Label>
              <Input
                id="customer-name"
                placeholder="Enter customer name"
                value={formData.customer_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, customer_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone">Customer Phone *</Label>
              <Input
                id="customer-phone"
                placeholder="Phone number (unique identifier)"
                value={formData.customer_phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, customer_phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email">Customer Email (Optional)</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="Email address (can be repeated)"
                value={formData.customer_email}
                onChange={(e) => setFormData((prev) => ({ ...prev, customer_email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesperson">Salesperson</Label>
              <Input
                id="salesperson"
                placeholder="Sales representative"
                value={formData.salesperson}
                onChange={(e) => setFormData((prev) => ({ ...prev, salesperson: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                placeholder="Enter vendor name"
                value={formData.vendor}
                onChange={(e) => setFormData((prev) => ({ ...prev, vendor: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-id">Booking ID</Label>
              <Input
                id="booking-id"
                placeholder="Booking reference"
                value={formData.booking_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, booking_id: e.target.value }))}
              />
            </div>
          </div>

          {/* Financial Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sale-amount">Sale Amount (BDT) *</Label>
              <Input
                id="sale-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.sale_amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, sale_amount: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cogs">COGS (Cost) *</Label>
              <Input
                id="cogs"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.cogs}
                onChange={(e) => setFormData((prev) => ({ ...prev, cogs: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-fee-percent">Transaction Fee %</Label>
              <Input
                id="transaction-fee-percent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                value={formData.transaction_fee_percent}
                onChange={(e) => setFormData((prev) => ({ ...prev, transaction_fee_percent: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Transaction Fee Amount</Label>
              <div className="p-2 rounded border text-sm font-medium bg-gray-50">
                ৳{calculatedFee.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gross Profit/Loss</Label>
              <div
                className={`p-2 rounded border text-sm font-medium ${calculatedProfit >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
              >
                ৳{calculatedProfit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gross Profit Margin</Label>
              <div
                className={`p-2 rounded border text-sm font-medium ${calculatedMargin >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
              >
                {calculatedMargin.toFixed(2)}%
              </div>
            </div>

            <div className="space-y-2">
              <Label>Net Profit/Loss</Label>
              <div
                className={`p-2 rounded border text-sm font-medium ${calculatedNetProfit >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
              >
                ৳{calculatedNetProfit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Net Profit Margin</Label>
              <div
                className={`p-2 rounded border text-sm font-medium ${calculatedNetMargin >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
              >
                {calculatedNetMargin.toFixed(2)}%
              </div>
            </div>


            <div className="space-y-2">
              <Label htmlFor="payment-received">Payment Received</Label>
              <Input
                id="payment-received"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.payment_received}
                onChange={(e) => setFormData((prev) => ({ ...prev, payment_received: e.target.value }))}
              />
            </div>

            {/* Show Partial Payment fields if payment_status is Partial */}
            {formData.payment_status === "Partial" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount-paid">Amount Paid</Label>
                  <Input
                    id="amount-paid"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount_paid: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Outstanding Balance</Label>
              <div
                className={`p-2 rounded border text-sm font-medium ${calculatedBalance <= 0 ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"}`}
              >
                ৳{calculatedBalance.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select
                value={formData.payment_method || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, payment_method: value as SalesFormState["payment_method"] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Bank Card">Bank Card</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="bKash">bKash</SelectItem>
                  <SelectItem value="Nagad">Nagad</SelectItem>
                  <SelectItem value="SSLCOMMERZ">SSLCOMMERZ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-status">Payment Status</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, payment_status: value as SalesFormState["payment_status"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product-Specific Fields */}
          {formData.product_type && (
            <div>
              <h3 className="text-lg font-semibold mb-4">{formData.product_type} Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderProductSpecificFields()}
              </div>
            </div>
          )}

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
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or special instructions"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Reporting Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add tag (e.g., Customer type, Channel, Campaign)"
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

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              {initialData ? "Update Sale" : "Add Sale"}
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
