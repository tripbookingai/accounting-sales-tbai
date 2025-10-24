import { createClient } from "@/lib/supabase/server"
import { getProxyUrl } from "@/lib/cdn-client"
import type { Sale } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Params {
  params: { id: string }
}

export default async function SaleDetailPage({ params }: Params) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales_with_profiles")
    .select("*")
    .eq("id", params.id)
    .single()
    
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold">Sale not found</h1>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    )
  }

  const sale: Sale = data

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sale Details</h1>
          <p className="text-muted-foreground mt-1">Details for sale ID: {sale.id}</p>
        </div>
        <div className="shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/sales">Back to Sales</Link>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {/* Display creator info */}
          {(sale.profile_full_name || sale.profile_email) && (
            <div className="flex flex-col gap-1 border-b pb-2">
              <span className="font-semibold text-gray-700 capitalize text-xs tracking-wide">Created By</span>
              <span className="text-base text-gray-900">
                {sale.profile_full_name || sale.profile_email}
              </span>
            </div>
          )}
          
          {Object.entries(sale)
            .filter(([key, value]) => value !== null && value !== undefined && value !== "" && value !== false && key !== "id" && key !== "user_id" && key !== "customer_id" && key !== "profile_email" && key !== "profile_full_name")
            .map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1 border-b pb-2 last:border-b-0">
                <span className="font-semibold text-gray-700 capitalize text-xs tracking-wide">{key.replace(/_/g, ' ')}</span>
                <span className="text-base text-gray-900 break-all">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>
              </div>
            ))}

          {Array.isArray(sale.attachment_urls) && sale.attachment_urls.length > 0 && (
            <div className="flex flex-col gap-1 border-b pb-2 last:border-b-0">
              <span className="font-semibold text-gray-700 capitalize text-xs tracking-wide">Attachments</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {sale.attachment_urls.map((url: string, idx: number) => {
                  const proxyUrl = getProxyUrl(url)
                  return (
                    <div key={url} className="flex flex-col items-center">
                      {url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proxyUrl} alt={`Attachment ${idx + 1}`} className="w-28 h-28 object-contain rounded border mb-1" />
                      ) : (
                        <a href={proxyUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 mb-1">File {idx + 1}</a>
                      )}
                      <a href={proxyUrl} download className="text-xs text-blue-500 underline">Download</a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
