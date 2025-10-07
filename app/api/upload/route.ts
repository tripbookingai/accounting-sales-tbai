import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, deleteFile, extractFilename } from '@/lib/cdn-client'
import { MAX_FILE_SIZE, getFileSizeError } from '@/lib/cdn-config'

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn.tripbooking.ai'

/**
 * GET /api/upload?filename=<filename>
 * Download a file from the CDN (authenticated)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filenameOrUrl = searchParams.get('filename')

    if (!filenameOrUrl) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Extract just the filename if a full URL was provided
    const filename = extractFilename(filenameOrUrl)
    
    const apiKey = process.env.CDN_API_KEY
    
    console.log('Downloading file:', filename)
    console.log('CDN_API_KEY available:', !!apiKey)
    console.log('CDN_BASE_URL:', CDN_BASE_URL)

    if (!apiKey) {
      console.error('CDN_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'CDN API key is not configured on server' },
        { status: 500 }
      )
    }

    // Download from CDN directly with API key
    const cdnUrl = `${CDN_BASE_URL}/files/${filename}`
    console.log('Fetching from:', cdnUrl)
    
    const response = await fetch(cdnUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
      },
    })

    console.log('CDN Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('CDN Error response:', errorText)
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing API key for CDN' },
          { status: 401 }
        )
      }
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'File not found on CDN' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `CDN request failed: HTTP ${response.status}` },
        { status: response.status }
      )
    }

    // Get the blob from CDN response
    const blob = await response.blob()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // Return the file with appropriate headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Download error details:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to download file'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/upload
 * Upload a file to the CDN
 * Body: multipart/form-data with 'file' and optional 'visibility' fields
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const visibility = (formData.get('visibility') as 'public' | 'private') || 'private'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: getFileSizeError(file.size) },
        { status: 413 }
      )
    }

    // Upload to CDN with size limit
    const result = await uploadFile(file, visibility, MAX_FILE_SIZE)

    // Return the CDN URL
    return NextResponse.json({ 
      url: result.url,
      filename: result.filename,
      visibility: result.visibility,
      message: result.message
    })
  } catch (error) {
    console.error('Upload error:', error)
    
    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
    
    // Return 413 for file too large errors
    if (errorMessage.includes('exceeds maximum') || errorMessage.includes('too large')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 413 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/upload?filename=<filename>
 * Delete a file from the CDN
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filenameOrUrl = searchParams.get('filename')

    if (!filenameOrUrl) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Extract just the filename if a full URL was provided
    const filename = extractFilename(filenameOrUrl)

    // Delete from CDN
    const result = await deleteFile(filename)

    return NextResponse.json({ 
      message: result.message,
      filename 
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete file' },
      { status: 500 }
    )
  }
}
