/**
 * AWS S3 File Management Client (Server-side only)
 *
 * Handles upload, download, and deletion of files using AWS S3.
 * This module must only be used in server-side contexts (API routes, server actions).
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const AWS_REGION = process.env.AWS_S3_REGION || 'us-east-1'
const AWS_BUCKET = process.env.AWS_S3_BUCKET_NAME || ''
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || ''
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || ''

function getS3Client(): S3Client {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_BUCKET) {
    throw new Error(
      'AWS S3 is not fully configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables.'
    )
  }
  return new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  })
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface S3UploadResult {
  key: string        // S3 object key (UUID-based path)
  url: string        // Public or proxy URL for this file
  filename: string   // Original filename stored in metadata
  contentType: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the public S3 URL for an object key.
 * If the bucket is configured for public access this URL is directly accessible.
 * For private buckets the API proxy route is used instead.
 */
export function getS3ObjectUrl(key: string): string {
  return `https://${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`
}

/**
 * Extract the S3 object key from a full S3 URL.
 * Handles both path-style and virtual-hosted-style URLs.
 */
export function extractS3Key(url: string): string {
  try {
    const urlObj = new URL(url)
    // virtual-hosted: https://bucket.s3.region.amazonaws.com/key
    const virtualHosted = `${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com`
    if (urlObj.hostname === virtualHosted || urlObj.hostname.endsWith('.amazonaws.com')) {
      return urlObj.pathname.replace(/^\//, '')
    }
    // path-style: https://s3.region.amazonaws.com/bucket/key
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    if (pathParts[0] === AWS_BUCKET) {
      return pathParts.slice(1).join('/')
    }
    // fallback – treat the whole pathname (minus leading /) as the key
    return urlObj.pathname.replace(/^\//, '')
  } catch {
    return url.split('/').pop() || url
  }
}

/**
 * Returns true when the given URL points to an S3 object in our bucket.
 */
export function isS3Url(url: string): boolean {
  if (!AWS_BUCKET) return false
  return (
    url.includes(`${AWS_BUCKET}.s3`) ||
    url.includes(`s3.amazonaws.com/${AWS_BUCKET}`) ||
    url.includes(`s3.${AWS_REGION}.amazonaws.com/${AWS_BUCKET}`)
  )
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Upload a file to S3 under a structured folder path.
 *
 * Expected folder structure inside the bucket:
 *
 *   accounts-attachments/
 *     sales/
 *       {session-id}/          ← one sub-folder per sales record upload session
 *         {uuid}.ext
 *     expenses/
 *       {session-id}/          ← one sub-folder per expense record upload session
 *         {uuid}.ext
 *
 * @param file   - Web API File object (Node.js ≥ 18 / Next.js runtime)
 * @param folder - Full folder path including trailing slash.
 *                 Defaults to "accounts-attachments/" when not provided.
 *                 Pass e.g. "accounts-attachments/sales/session-123/" from the caller.
 */
export async function uploadFileToS3(
  file: File,
  folder: string = 'accounts-attachments/'
): Promise<S3UploadResult> {
  const s3 = getS3Client()

  // Ensure the folder always ends with a slash
  const prefix = folder.endsWith('/') ? folder : `${folder}/`

  // Build a unique key that retains the original file extension
  const ext = file.name.split('.').pop()
  const key = `${prefix}${uuidv4()}${ext ? `.${ext}` : ''}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const command = new PutObjectCommand({
    Bucket: AWS_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: file.type || 'application/octet-stream',
    Metadata: {
      'original-filename': encodeURIComponent(file.name),
    },
  })

  await s3.send(command)

  return {
    key,
    url: getS3ObjectUrl(key),
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
  }
}

// ---------------------------------------------------------------------------
// Download / Stream
// ---------------------------------------------------------------------------

/**
 * Retrieve an object from S3 as a Node.js readable stream body.
 * Returns the raw GetObjectCommandOutput so the caller can stream it.
 */
export async function getS3ObjectStream(key: string) {
  const s3 = getS3Client()
  const command = new GetObjectCommand({ Bucket: AWS_BUCKET, Key: key })
  const response = await s3.send(command)
  return response
}

/**
 * Generate a short-lived pre-signed URL (1 hour) for private downloads.
 */
export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const s3 = getS3Client()
  const command = new GetObjectCommand({ Bucket: AWS_BUCKET, Key: key })
  return getSignedUrl(s3, command, { expiresIn })
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete an object from S3 by its key.
 */
export async function deleteS3Object(key: string): Promise<void> {
  const s3 = getS3Client()
  const command = new DeleteObjectCommand({ Bucket: AWS_BUCKET, Key: key })
  await s3.send(command)
}

// ---------------------------------------------------------------------------
// Metadata / existence check
// ---------------------------------------------------------------------------

/**
 * Check whether an object exists in S3 without downloading it.
 */
export async function s3ObjectExists(key: string): Promise<boolean> {
  try {
    const s3 = getS3Client()
    await s3.send(new HeadObjectCommand({ Bucket: AWS_BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}
