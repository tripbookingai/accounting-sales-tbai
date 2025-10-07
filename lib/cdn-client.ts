/**
 * CDN File Management API Client
 * Base URL: https://cdn.tripbooking.ai
 * 
 * This client handles file uploads, downloads, and deletions
 * using the TripBooking CDN service.
 */

import { MAX_FILE_SIZE, getFileSizeError } from './cdn-config'

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn.tripbooking.ai'
const CDN_API_KEY = process.env.CDN_API_KEY || ''

export interface UploadResponse {
  message: string
  filename: string
  visibility: 'public' | 'private'
  url: string
}

export interface DeleteResponse {
  message: string
}

export interface CDNError {
  error: string
  message?: string
}

/**
 * Upload a file to the CDN
 * @param file - The file to upload
 * @param visibility - Whether the file should be 'public' or 'private' (default: 'private')
 * @param maxSize - Maximum file size in bytes (default: from config)
 * @returns Upload response with the file URL
 */
export async function uploadFile(
  file: File,
  visibility: 'public' | 'private' = 'private',
  maxSize: number = MAX_FILE_SIZE
): Promise<UploadResponse> {
  if (!CDN_API_KEY) {
    throw new Error('CDN API key is not configured')
  }

  // Validate file size before upload
  if (file.size > maxSize) {
    throw new Error(getFileSizeError(file.size))
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('visibility', visibility)

  const response = await fetch(`${CDN_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'X-API-KEY': CDN_API_KEY,
    },
    body: formData,
  })

  if (!response.ok) {
    // Handle specific error codes
    if (response.status === 413) {
      throw new Error(getFileSizeError(file.size) + ' The server rejected the upload. Please try a smaller file.')
    }
    
    const error: CDNError = await response.json().catch(() => ({
      error: 'Upload failed',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.message || error.error || 'Failed to upload file')
  }

  return response.json()
}

/**
 * Download a file from the CDN
 * @param filename - The UUID filename to download
 * @param isPrivate - Whether the file is private (requires API key)
 * @returns Blob of the file
 */
export async function downloadFile(
  filename: string,
  isPrivate: boolean = true
): Promise<Blob> {
  const headers: HeadersInit = {}
  
  if (isPrivate) {
    if (!CDN_API_KEY) {
      throw new Error('CDN API key is not configured')
    }
    headers['X-API-KEY'] = CDN_API_KEY
  }

  const response = await fetch(`${CDN_BASE_URL}/files/${filename}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized: Invalid or missing API key')
    }
    if (response.status === 404) {
      throw new Error('File not found')
    }
    throw new Error(`Failed to download file: HTTP ${response.status}`)
  }

  return response.blob()
}

/**
 * Delete a file from the CDN
 * @param filename - The UUID filename to delete
 * @returns Delete response
 */
export async function deleteFile(filename: string): Promise<DeleteResponse> {
  if (!CDN_API_KEY) {
    throw new Error('CDN API key is not configured')
  }

  const response = await fetch(`${CDN_BASE_URL}/delete/${filename}`, {
    method: 'DELETE',
    headers: {
      'X-API-KEY': CDN_API_KEY,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized: Invalid or missing API key')
    }
    if (response.status === 404) {
      throw new Error('File not found')
    }
    const error: CDNError = await response.json().catch(() => ({
      error: 'Delete failed',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.message || error.error || 'Failed to delete file')
  }

  return response.json()
}

/**
 * Extract filename from a CDN URL
 * @param url - Full CDN URL
 * @returns Just the filename
 */
export function extractFilename(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    return pathname.split('/').pop() || ''
  } catch {
    // If URL parsing fails, try simple string extraction
    return url.split('/').pop() || ''
  }
}

/**
 * Get authenticated proxy URL for viewing/downloading private files
 * Converts CDN URL to local API proxy URL that handles authentication
 * @param cdnUrl - The full CDN URL
 * @returns Proxy URL through /api/upload endpoint
 */
export function getProxyUrl(cdnUrl: string): string {
  const filename = extractFilename(cdnUrl)
  return `/api/upload?filename=${encodeURIComponent(filename)}`
}

/**
 * Check if a URL is a CDN URL
 * @param url - URL to check
 * @returns true if the URL is from the CDN
 */
export function isCDNUrl(url: string): boolean {
  return url.startsWith(CDN_BASE_URL) || url.includes('cdn.tripbooking.ai')
}

/**
 * Get the full CDN URL for a filename
 * @param filename - The UUID filename
 * @returns Full CDN URL
 */
export function getCDNUrl(filename: string): string {
  return `${CDN_BASE_URL}/files/${filename}`
}

/**
 * Client-side upload helper for use in components
 * This makes a request to the Next.js API route which then calls the CDN
 * @param file - The file to upload
 * @param visibility - Whether the file should be 'public' or 'private' (default: 'private')
 * @param maxSize - Maximum file size in bytes (default: from config)
 * @returns The CDN URL of the uploaded file
 */
export async function uploadFileViaAPI(
  file: File,
  visibility: 'public' | 'private' = 'private',
  maxSize: number = MAX_FILE_SIZE
): Promise<string> {
  // Validate file size before upload
  if (file.size > maxSize) {
    throw new Error(getFileSizeError(file.size))
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('visibility', visibility)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    // Handle specific error codes
    if (response.status === 413) {
      throw new Error(getFileSizeError(file.size) + ' Please try a smaller file.')
    }

    const error = await response.json().catch(() => ({
      error: 'Upload failed',
    }))
    throw new Error(error.error || 'Failed to upload file')
  }

  const data = await response.json()
  return data.url
}

/**
 * Client-side delete helper for use in components
 * This makes a request to the Next.js API route which then calls the CDN
 */
export async function deleteFileViaAPI(url: string): Promise<void> {
  const filename = extractFilename(url)
  
  const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Delete failed',
    }))
    throw new Error(error.error || 'Failed to delete file')
  }
}

/**
 * Client-side download helper for use in components
 * This makes a request to the Next.js API route which handles authentication
 * @param url - The CDN URL of the file to download
 * @param filename - Optional custom filename for the download
 */
export async function downloadFileViaAPI(url: string, filename?: string): Promise<void> {
  const extractedFilename = filename || extractFilename(url)
  
  const response = await fetch(`/api/upload?filename=${encodeURIComponent(extractedFilename)}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Download failed',
    }))
    throw new Error(error.error || 'Failed to download file')
  }

  // Create a blob and trigger download
  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = extractedFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(downloadUrl)
}
