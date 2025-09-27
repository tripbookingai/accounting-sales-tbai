export interface ExpenseCategory {
  id: string
  name: string
  parent_id: string | null
  user_id: string
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  date: string
  category_id: string | null
  amount: number
  currency: string
  paid_through: "Company" | "Employee" | "Bank" | "Credit Card" | "Cash" | "Mobile Wallet"
  tax_amount: number
  tax_percentage: number
  vendor: string | null
  reference_number: string | null
  notes: string | null
  customer_name: string | null
  attachment_urls: string[] | null // Multiple attachments
  // attachment_url: string | null // Deprecated, use attachment_urls
  approval_status: "Pending" | "Approved" | "Paid"
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  user_id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  vendor_type: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  user_id: string
  name: string
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  user_id: string
  transaction_date: string
  product_type: "Air Ticket" | "Hotel" | "Tour Package" | "Visa"
  customer_id: string | null
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  salesperson: string | null
  sale_amount: number
  cogs: number // Cost of Goods Sold
  transaction_fee_percent: number // % (configurable by payment method)
  transaction_fee_amount: number // Auto-calculated
  profit_loss: number // Gross Profit/Loss (sale_amount - cogs)
  net_profit_loss: number // Net Profit/Loss (sale_amount - cogs - transaction_fee_amount)
  profit_margin: number // Gross Profit Margin (%)
  net_profit_margin: number // Net Profit Margin (%)
  payment_method: "Bank Transfer" | "Bank Card" | "Cash" | "bKash" | "Nagad" | "SSLCOMMERZ" | null
  payment_received: number
  outstanding_balance: number // Auto-calculated
  payment_status: "Paid" | "Partial" | "Pending"
  notes: string | null
  tags: string[]
  attachment_urls: string[] | null // Multiple attachments


  // Product-specific fields
  vendor: string | null
  booking_id: string | null

  // Air Ticket specific
  trip_type: "one_way" | "round_trip" | null
  departure_date: string | null
  return_date: string | null
  flight_route: string | null
  number_of_passengers: number | null
  travel_date: string | null

  // Hotel specific
  location: string | null
  checkin_date: string | null
  checkout_date: string | null
  nights: number | null
  number_of_rooms: number | null
  booking_confirmation: string | null

  // Tour Package specific
  package_name: string | null
  destinations: string | null
  duration_days: number | null
  start_date: string | null
  end_date: string | null
  number_of_travelers: number | null
  package_reference: string | null

  // Visa Sales specific
  country: string | null
  visa_type: string | null
  number_of_applicants: number | null
  courier_fee: number | null
  submission_date: string | null
  received_date: string | null
  visa_status: "Pending" | "Submitted" | "Approved" | "Rejected" | "Delivered" | null

  created_at: string
  updated_at: string
}
