import { NextRequest, NextResponse } from 'next/server'
import {
  uploadFileToS3,
  getS3ObjectStream,
  deleteS3Object,
  extractS3Key,
  isS3Url,
} from '@/lib/s3-client'
import { MAX_FILE_SIZE, getFileSizeError } from '@/lib/cdn-config'

/**
 * GET /api/upload?filename=<s3-key-or-url>
 * Stream a private file from S3 through this API route (authenticated proxy).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filenameOrUrl = searchParams.get('filename')

    if (!filenameOrUrl) {
      return NextResponse.json({ error: 'Filename/key is required' }, { status: 400 })
    }

    // Accept either a full S3 URL or a raw object key
    const key = isS3Url(filenameOrUrl) ? extractS3Key(filenameOrUrl) : filenameOrUrl

    console.log('Downloading S3 object:', key)

    const s3Response = await getS3ObjectStream(key)

    if (!s3Response.Body) {
      return NextResponse.json({ error: 'File not found in S3' }, { status: 404 })
    }

    const contentType = s3Response.ContentType || 'application/octet-stream'
    // Extract original filename from metadata if available
    const originalFilename = s3Response.Metadata?.['original-filename']
      ? decodeURIComponent(s3Response.Metadata['original-filename'])
      : key.split('/').pop() || 'file'

    // Convert the S3 stream to a Uint8Array for the response
    const chunks: Uint8Array[] = []
    const stream = s3Response.Body as AsyncIterable<Uint8Array>
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const body = Buffer.concat(chunks)

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${originalFilename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('S3 download error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to download file'
    if (errorMessage.includes('NoSuchKey') || errorMessage.includes('not found')) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * POST /api/upload
 * Upload a file to AWS S3.
 * Body: multipart/form-data with:
 *   - file       (required) — the file to upload
 *   - folder     (optional) — full S3 folder path, e.g. "accounts-attachments/sales/session-123"
 *                             Defaults to "accounts-attachments/" when omitted.
 *   - visibility (optional) — ignored; kept for backwards compatibility
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: getFileSizeError(file.size) }, { status: 413 })
    }

    // Respect the folder param so callers can place files in the right sub-folder
    const folder = (formData.get('folder') as string | null) || 'accounts-attachments/'

    const result = await uploadFileToS3(file, folder)

    return NextResponse.json({
      url: result.url,
      key: result.key,
      filename: result.filename,
      message: 'File uploaded successfully to S3',
    })
  } catch (error) {
    console.error('S3 upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'

    if (errorMessage.includes('exceeds maximum') || errorMessage.includes('too large')) {
      return NextResponse.json({ error: errorMessage }, { status: 413 })
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * DELETE /api/upload?filename=<s3-key-or-url>
 * Delete a file from AWS S3.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filenameOrUrl = searchParams.get('filename')

    if (!filenameOrUrl) {
      return NextResponse.json({ error: 'Filename/key is required' }, { status: 400 })
    }

    // Accept either a full S3 URL or a raw object key
    const key = isS3Url(filenameOrUrl) ? extractS3Key(filenameOrUrl) : filenameOrUrl

    await deleteS3Object(key)

    return NextResponse.json({ message: 'File deleted successfully', key })
  } catch (error) {
    console.error('S3 delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete file' },
      { status: 500 }
    )
  }
}
