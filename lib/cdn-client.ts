/**
 * File Management API Client (Client-side)
 *
 * Previously backed by the TripBooking CDN; now backed by AWS S3 via the
 * Next.js /api/upload proxy route.
 *
 * The public API surface is unchanged so that all components
 * (sales-form, expense-form, file-attachment, etc.) continue to work
 * without modification.
 */

import { MAX_FILE_SIZE, getFileSizeError } from './cdn-config'

// ---------------------------------------------------------------------------
// Re-export size helpers (consumers import from here)
// ---------------------------------------------------------------------------
export { MAX_FILE_SIZE, getFileSizeError }

// ---------------------------------------------------------------------------
// Types (kept for backwards compatibility)
// ---------------------------------------------------------------------------

export interface UploadResponse {
  message: string
  filename: string
  url: string
  key?: string
}

export interface DeleteResponse {
  message: string
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

const S3_BUCKET = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || ''
const S3_REGION = process.env.NEXT_PUBLIC_AWS_S3_REGION || 'us-east-1'

/**
 * Extract the file key / last path segment from an S3 URL or raw key.
 * Works with:
 *   https://bucket.s3.region.amazonaws.com/attachments/uuid.pdf  → attachments/uuid.pdf
 *   attachments/uuid.pdf                                         → attachments/uuid.pdf
 */
export function extractFilename(url: string): string {
  try {
    const urlObj = new URL(url)
    // Strip leading slash → gives us the full object key
    return urlObj.pathname.replace(/^\//, '')
  } catch {
    // Not a valid URL – treat as raw key/filename
    return url
  }
}

/**
 * Returns true when the URL points to an S3 object.
 * Also returns true for legacy CDN URLs so old stored URLs keep working
 * through the proxy route.
 */
export function isCDNUrl(url: string): boolean {
  // S3 virtual-hosted style
  if (url.includes('.s3.') && url.includes('.amazonaws.com')) return true
  // S3 path style
  if (url.includes('s3.amazonaws.com/')) return true
  // Legacy CDN (still routed through proxy → S3 by key)
  if (url.includes('cdn.tripbooking.ai')) return true
  return false
}

/** Alias for isCDNUrl – use this in new code. */
export const isStorageUrl = isCDNUrl

/**
 * Build a proxy URL so private S3 objects can be viewed/downloaded
 * through the Next.js API route without exposing credentials.
 * Pass either the full S3 URL or the object key.
 */
export function getProxyUrl(urlOrKey: string): string {
  return `/api/upload?filename=${encodeURIComponent(urlOrKey)}`
}

/**
 * Build the public S3 URL for an object key.
 * Requires NEXT_PUBLIC_AWS_S3_BUCKET_NAME and NEXT_PUBLIC_AWS_S3_REGION to be set.
 */
export function getCDNUrl(key: string): string {
  if (!S3_BUCKET) return key
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`
}

// ---------------------------------------------------------------------------
// Client-side upload via /api/upload proxy
// ---------------------------------------------------------------------------

/**
 * Upload a file via the Next.js API route → AWS S3.
 * Returns the S3 object URL to be stored in the database.
 *
 * @param file       The file to upload
 * @param visibility Ignored (kept for API compatibility)
 * @param maxSize    Maximum allowed file size in bytes
 * @param folder     S3 folder path, e.g. "accounts-attachments/sales/session-123"
 *                   Defaults to "accounts-attachments/" when not provided.
 */
export async function uploadFileViaAPI(
  file: File,
  visibility: 'public' | 'private' = 'private',
  maxSize: number = MAX_FILE_SIZE,
  folder?: string
): Promise<string> {
  if (file.size > maxSize) {
    throw new Error(getFileSizeError(file.size))
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('visibility', visibility)
  if (folder) {
    formData.append('folder', folder)
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error(getFileSizeError(file.size) + ' Please try a smaller file.')
    }
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error.error || 'Failed to upload file')
  }

  const data = await response.json()
  return data.url
}

// ---------------------------------------------------------------------------
// Client-side delete via /api/upload proxy
// ---------------------------------------------------------------------------

/**
 * Delete a file via the Next.js API route → AWS S3.
 * Accepts either a full S3 URL or an object key.
 */
export async function deleteFileViaAPI(urlOrKey: string): Promise<void> {
  const response = await fetch(
    `/api/upload?filename=${encodeURIComponent(urlOrKey)}`,
    { method: 'DELETE' }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Delete failed' }))
    throw new Error(error.error || 'Failed to delete file')
  }
}

// ---------------------------------------------------------------------------
// Client-side download via /api/upload proxy
// ---------------------------------------------------------------------------

/**
 * Download a file through the Next.js API route (handles private S3 auth).
 * Accepts either a full S3 URL or an object key.
 *
 * @param urlOrKey     Full S3 URL or object key
 * @param displayName  Suggested filename for the browser download dialog
 */
export async function downloadFileViaAPI(urlOrKey: string, displayName?: string): Promise<void> {
  const suggestedName = displayName || urlOrKey.split('/').pop() || 'download'

  const response = await fetch(
    `/api/upload?filename=${encodeURIComponent(urlOrKey)}`,
    { method: 'GET' }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Download failed' }))
    throw new Error(error.error || 'Failed to download file')
  }

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = suggestedName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(downloadUrl)
}

// ---------------------------------------------------------------------------
// Legacy server-side stubs (kept so existing imports don't break immediately)
// ---------------------------------------------------------------------------

/** @deprecated Use uploadFileToS3 from @/lib/s3-client (server-side only) */
export async function uploadFile(
  _file: File,
  _visibility: 'public' | 'private' = 'private',
  _maxSize: number = MAX_FILE_SIZE
): Promise<UploadResponse> {
  throw new Error('uploadFile() is removed. Use uploadFileToS3 from @/lib/s3-client (server-side only).')
}

/** @deprecated Use deleteS3Object from @/lib/s3-client (server-side only) */
export async function deleteFile(_filename: string): Promise<DeleteResponse> {
  throw new Error('deleteFile() is removed. Use deleteS3Object from @/lib/s3-client (server-side only).')
}

/** @deprecated Use getS3ObjectStream from @/lib/s3-client (server-side only) */
export async function downloadFile(_filename: string, _isPrivate = true): Promise<Blob> {
  throw new Error('downloadFile() is removed. Use getS3ObjectStream from @/lib/s3-client (server-side only).')
}
