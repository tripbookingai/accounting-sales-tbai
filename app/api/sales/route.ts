import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Sale } from "@/lib/types";

// Type for inserting a new sale that aligns exactly with what the real app uses.
type InsertSale = Omit<
  Sale,
  "id" | "created_at" | "updated_at" | "profit_loss" | "profit_margin" | "outstanding_balance"
>;

function parseMoneyValue(value: unknown, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed < 0 ? 0 : parsed;
}

function resolvePaymentReceived(body: any, fallback = 0) {
  if (body.payment_received !== undefined) {
    return parseMoneyValue(body.payment_received, fallback);
  }

  if (body.amount_paid !== undefined) {
    return parseMoneyValue(body.amount_paid, fallback);
  }

  return fallback;
}

function derivePaymentStatus(
  saleAmount: number,
  paymentReceived: number,
): Sale["payment_status"] {
  if (paymentReceived <= 0) return "Pending";
  if (saleAmount > 0 && paymentReceived >= saleAmount) return "Paid";
  return "Partial";
}

function withDerivedAmountPaid<T extends { payment_received?: number | null }>(sale: T) {
  return {
    ...sale,
    amount_paid: sale.payment_received ?? 0,
  };
}

// Helper to calculate nights for Hotel sales
function calculateNights(checkin?: string, checkout?: string, rooms?: number) {
  if (!checkin || !checkout) return null;
  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  const daysDiff = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
  const numberOfRooms = Number(rooms) || 1;
  return daysDiff > 0 ? daysDiff * numberOfRooms : 0;
}

// Simple authentication check based on an expected token
function isAuthenticated(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const expectedToken = process.env.SALES_API_KEY || "TEST_TOKEN";
  
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return false;
  }
  return true;
}

// Initialize an Admin Supabase Client to bypass RLS for server-to-server operations
function getAdminSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// ----------------------------------------------------------------------
// POST: Create a new sale
// ----------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    // 1. Basic security check
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: "Unauthorized. Invalid Token." }, { status: 401 });
    }

    const body = await request.json();

    // 2. Product type validation 
    // This allows Hotel, but you might want to expand this later.
    if (body.product_type !== "Hotel") {
      return NextResponse.json({ error: "This endpoint is essentially tailored for Hotel sales. Keep product_type as Hotel." }, { status: 400 });
    }

    // 3. Required Fields Match
    if (!body.customer_name || !body.customer_phone) {
      return NextResponse.json({ error: "customer_name and customer_phone are required" }, { status: 400 });
    }

    // The nights column is generated dynamically by the database based on checkin_date, checkout_date, and number_of_rooms.
    // So we don't need to calculate or send it.
    
    // Initialize the Admin client
    const supabaseAdmin = getAdminSupabaseClient();

    // In a real-world scenario, you may want to set `user_id` to a specific system admin/bot UUID. 
    // Otherwise, without an owner, inserting may violate RLS unless using the Service Role Key.
    // The Service Role Key bypasses RLS, so we can store it successfully.
    // Replace "SYSTEM_BOT_UUID" with an actual admin user UUID from your Supabase `auth.users` table.
    const SYSTEM_BOT_UUID = process.env.SYSTEM_USER_ID || "00000000-0000-0000-0000-000000000000";

    const saleAmount = Number(body.sale_amount) || 0;
    const cogs = Number(body.cogs) || 0;
    const transactionFeePercent = Number(body.transaction_fee_percent) || 0;
    const paymentReceived = resolvePaymentReceived(body);
    const paymentStatus = derivePaymentStatus(saleAmount, paymentReceived);

    const saleData: InsertSale = {
      transaction_date: body.transaction_date || new Date().toISOString().split("T")[0],
      product_type: body.product_type, // Typically "Hotel"
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email || null,
      salesperson: body.salesperson || null,
      sale_amount: saleAmount,
      cogs: cogs,
      transaction_fee_percent: transactionFeePercent,
      payment_method: body.payment_method || null,
      payment_received: paymentReceived,
      payment_status: paymentStatus,
      notes: body.notes || null,
      tags: body.tags || [],
      vendor: body.vendor || null,
      booking_id: body.booking_id || null,
      attachment_urls: body.attachment_urls || [],
      
      // Ownership fields 
      user_id: body.user_id || SYSTEM_BOT_UUID, 
      customer_id: body.customer_id || null,
      
      // Auto-calculated fields that are computed in the frontend before insertion
      transaction_fee_amount: saleAmount * (transactionFeePercent / 100),
      net_profit_loss: saleAmount - cogs - (saleAmount * (transactionFeePercent / 100)),
      net_profit_margin: saleAmount > 0 
        ? ((saleAmount - cogs - (saleAmount * (transactionFeePercent / 100))) / saleAmount) * 100 
        : 0,
      
      // Hotel Specific Fields
      location: body.location || null,
      checkin_date: body.checkin_date || null,
      checkout_date: body.checkout_date || null,
      number_of_rooms: body.number_of_rooms ? Number(body.number_of_rooms) : null,
      booking_confirmation: body.booking_confirmation || null,
      hotel_paid: typeof body.hotel_paid === 'boolean' ? body.hotel_paid : null,
      nights: calculateNights(body.checkin_date, body.checkout_date, body.number_of_rooms) || null,
      
      // Null out unneeded data for other product types
      trip_type: null,
      departure_date: null,
      return_date: null,
      flight_route: null,
      number_of_passengers: null,
      travel_date: null,
      package_name: null,
      destinations: null,
      duration_days: null,
      start_date: null,
      end_date: null,
      number_of_travelers: null,
      package_reference: null,
      country: null,
      visa_type: null,
      number_of_applicants: null,
      courier_fee: null,
      submission_date: null,
      received_date: null,
      visa_status: null,
      ship_selections: null,
      commission_percent: null,
    };

    // Insert directly using Admin client to bypass require session cookie
    const { data: newSale, error } = await supabaseAdmin
      .from("sales")
      .insert(saleData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: withDerivedAmountPaid(newSale) }, { status: 201 });
  } catch (error: any) {
    console.error("Sale POST API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create sale" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PATCH: Update an existing sale
// ----------------------------------------------------------------------
export async function PATCH(request: Request) {
  try {
     // 1. Basic security check
     if (!isAuthenticated(request)) {
      return NextResponse.json({ error: "Unauthorized. Invalid Token." }, { status: 401 });
    }

    const body = await request.json();

    // We must have the ID of the sale you want to update
    const saleId = body.id;
    if (!saleId) {
      return NextResponse.json({ error: "Missing required 'id' field in request body. Tell me which sale to update." }, { status: 400 });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const { data: existingSale, error: existingSaleError } = await supabaseAdmin
      .from("sales")
      .select("*")
      .eq("id", saleId)
      .single();

    if (existingSaleError || !existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Prepare fields to update
    const updateData: Partial<Sale> = {};

    // Standard mapping: Only include fields that were actually passed in the request body
    if (body.transaction_date !== undefined) updateData.transaction_date = body.transaction_date;
    if (body.customer_name !== undefined) updateData.customer_name = body.customer_name;
    if (body.customer_phone !== undefined) updateData.customer_phone = body.customer_phone;
    if (body.customer_email !== undefined) updateData.customer_email = body.customer_email;
    if (body.salesperson !== undefined) updateData.salesperson = body.salesperson;
    if (body.sale_amount !== undefined) updateData.sale_amount = Number(body.sale_amount);
    if (body.cogs !== undefined) updateData.cogs = Number(body.cogs);
    if (body.transaction_fee_percent !== undefined) updateData.transaction_fee_percent = Number(body.transaction_fee_percent);
    if (body.payment_method !== undefined) updateData.payment_method = body.payment_method;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.vendor !== undefined) updateData.vendor = body.vendor;
    if (body.booking_id !== undefined) updateData.booking_id = body.booking_id;
    if (body.attachment_urls !== undefined) updateData.attachment_urls = body.attachment_urls;
    
    // Hotel Specific Mapping
    if (body.location !== undefined) updateData.location = body.location;
    if (body.checkin_date !== undefined) updateData.checkin_date = body.checkin_date;
    if (body.checkout_date !== undefined) updateData.checkout_date = body.checkout_date;
    if (body.number_of_rooms !== undefined) updateData.number_of_rooms = body.number_of_rooms ? Number(body.number_of_rooms) : null;
    if (body.booking_confirmation !== undefined) updateData.booking_confirmation = body.booking_confirmation;
    if (body.hotel_paid !== undefined) updateData.hotel_paid = body.hotel_paid;

    const newSaleAmount =
      body.sale_amount !== undefined ? Number(body.sale_amount) : Number(existingSale.sale_amount);
    const newPaymentReceived = resolvePaymentReceived(body, Number(existingSale.payment_received) || 0);

    if (body.payment_received !== undefined || body.amount_paid !== undefined) {
      updateData.payment_received = newPaymentReceived;
    }

    updateData.payment_status = derivePaymentStatus(newSaleAmount, newPaymentReceived);

    // Recalculate nights ONLY if either checkin, checkout, or rooms are updated
    if (body.checkin_date !== undefined || body.checkout_date !== undefined || body.number_of_rooms !== undefined) {
      const calculatedNights = calculateNights(
        body.checkin_date, 
        body.checkout_date, 
        body.number_of_rooms
      );
      if (calculatedNights !== null) {
        updateData.nights = calculatedNights;
      }
    }

    // Handle recalculating the financials for PATCH dynamically
    // Fetch the existing sale to perform accurate math against old values vs updated values
    if (existingSale) {
      const newCogs = body.cogs !== undefined ? Number(body.cogs) : Number(existingSale.cogs);
      const newFeePercent = body.transaction_fee_percent !== undefined ? Number(body.transaction_fee_percent) : Number(existingSale.transaction_fee_percent);
      
      const newFeeAmount = newSaleAmount * (newFeePercent / 100);
      const newNetProfitLoss = newSaleAmount - newCogs - newFeeAmount;
      const newNetProfitMargin = newSaleAmount > 0 ? (newNetProfitLoss / newSaleAmount) * 100 : 0;
      
      updateData.transaction_fee_amount = newFeeAmount;
      updateData.net_profit_loss = newNetProfitLoss;
      updateData.net_profit_margin = newNetProfitMargin;
    }

    // Update directly via service role to bypass session restriction
    const { data: updatedSale, error } = await supabaseAdmin
      .from("sales")
      .update(updateData)
      .eq("id", saleId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: withDerivedAmountPaid(updatedSale) }, { status: 200 });
  } catch (error: any) {
    console.error("Sale PATCH API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update sale" }, { status: 500 });
  }
}
