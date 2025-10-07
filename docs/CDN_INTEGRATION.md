# CDN File Management Integration

This document describes the integration of the TripBooking CDN API for file management in the accounting webapp.

## Overview

The application now uses the TripBooking CDN service (`https://cdn.tripbooking.ai`) for handling file uploads, downloads, and deletions. This replaces the previous local file storage system.

## Features

- **Secure File Storage**: Files are stored on the CDN with UUID-based filenames
- **Private Files by Default**: All attachments are uploaded as private files requiring API key for access
- **Automatic File Management**: Upload and delete operations are handled through a unified API client
- **Support for Multiple File Types**: PDFs, images, documents, etc.

## Architecture

### Components

1. **CDN Client** (`lib/cdn-client.ts`)
   - Core API client for CDN operations
   - Server-side and client-side methods
   - Error handling and validation

2. **API Route** (`app/api/upload/route.ts`)
   - Next.js API endpoint
   - Proxies requests to CDN
   - Handles authentication

3. **Form Components**
   - `components/expense-form.tsx`
   - `components/sales-form.tsx`
   - Use the CDN client for file uploads

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# Required: Your CDN API key
CDN_API_KEY=your_secret_api_key_here

# Optional: Override the CDN base URL (defaults to https://cdn.tripbooking.ai)
NEXT_PUBLIC_CDN_BASE_URL=https://cdn.tripbooking.ai
```

**Important**: 
- `CDN_API_KEY` is server-side only (not exposed to the browser)
- `NEXT_PUBLIC_CDN_BASE_URL` is public (can be accessed from client-side code)

### Getting Your API Key

Contact the TripBooking CDN service administrator to obtain your API key.

## Usage

### Uploading Files

#### From Client Components

```typescript
import { uploadFileViaAPI } from '@/lib/cdn-client'

// Upload a file
const file: File = // ... get file from input
const url = await uploadFileViaAPI(file, 'private') // or 'public'
console.log('File uploaded:', url)
```

#### From Server Components/API Routes

```typescript
import { uploadFile } from '@/lib/cdn-client'

// Upload a file
const file: File = // ... get file from FormData
const result = await uploadFile(file, 'private')
console.log('File uploaded:', result.url)
```

### Deleting Files

#### From Client Components

```typescript
import { deleteFileViaAPI } from '@/lib/cdn-client'

// Delete a file by URL
await deleteFileViaAPI('https://cdn.tripbooking.ai/files/a1b2c3d4e5f6.pdf')
```

#### From Server Components/API Routes

```typescript
import { deleteFile } from '@/lib/cdn-client'

// Delete a file by filename
await deleteFile('a1b2c3d4e5f6.pdf')
```

### Downloading Files

```typescript
import { downloadFile } from '@/lib/cdn-client'

// Download a private file
const blob = await downloadFile('a1b2c3d4e5f6.pdf', true)

// Download a public file
const blob = await downloadFile('a1b2c3d4e5f6.pdf', false)

// Create a download link
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'filename.pdf'
a.click()
URL.revokeObjectURL(url)
```

### Helper Functions

```typescript
import { extractFilename, isCDNUrl, getCDNUrl } from '@/lib/cdn-client'

// Extract filename from URL
const filename = extractFilename('https://cdn.tripbooking.ai/files/abc123.pdf')
// Returns: 'abc123.pdf'

// Check if URL is from CDN
const isCDN = isCDNUrl('https://cdn.tripbooking.ai/files/abc123.pdf')
// Returns: true

// Get full CDN URL
const url = getCDNUrl('abc123.pdf')
// Returns: 'https://cdn.tripbooking.ai/files/abc123.pdf'
```

## API Endpoints

### POST /api/upload

Upload a file to the CDN.

**Request:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@example.pdf" \
  -F "visibility=private"
```

**Response:**
```json
{
  "url": "https://cdn.tripbooking.ai/files/a1b2c3d4e5f6.pdf",
  "filename": "a1b2c3d4e5f6.pdf",
  "visibility": "private",
  "message": "File uploaded successfully"
}
```

### DELETE /api/upload?filename=<filename>

Delete a file from the CDN.

**Request:**
```bash
curl -X DELETE "http://localhost:3000/api/upload?filename=a1b2c3d4e5f6.pdf"
```

**Response:**
```json
{
  "message": "a1b2c3d4e5f6.pdf deleted successfully",
  "filename": "a1b2c3d4e5f6.pdf"
}
```

## Database Schema

The application stores CDN file URLs in the database:

### Expenses Table

```sql
CREATE TABLE expenses (
  -- ... other fields ...
  attachment_urls TEXT[], -- Array of CDN URLs
  -- ... other fields ...
);
```

### Sales Table

```sql
CREATE TABLE sales (
  -- ... other fields ...
  attachment_urls TEXT[], -- Array of CDN URLs
  -- ... other fields ...
);
```

## Migration from Local Storage

If you're migrating from the old local storage system:

1. **Backup existing files** in `public/attachments/`
2. **Upload to CDN**: Use a migration script to upload existing files
3. **Update database**: Replace local URLs with CDN URLs
4. **Clean up**: Remove old files from `public/attachments/` after verification

### Sample Migration Script

```typescript
// scripts/migrate-to-cdn.ts
import { uploadFile } from '@/lib/cdn-client'
import fs from 'fs'
import path from 'path'

async function migrateFiles() {
  const attachmentsDir = path.join(process.cwd(), 'public', 'attachments')
  const files = fs.readdirSync(attachmentsDir)

  for (const filename of files) {
    const filePath = path.join(attachmentsDir, filename)
    const fileBuffer = fs.readFileSync(filePath)
    const file = new File([fileBuffer], filename)
    
    const result = await uploadFile(file, 'private')
    console.log(`Migrated: ${filename} -> ${result.url}`)
    
    // Update database with new URL
    // await updateDatabaseUrls(filename, result.url)
  }
}
```

## Security Considerations

1. **API Key Protection**: Never commit `.env.local` to version control
2. **Private Files**: Use `visibility: 'private'` for sensitive documents
3. **Access Control**: API key is required for private file access
4. **File Size Limits**: Default 50MB, configurable on CDN server
5. **HTTPS Only**: All communication is encrypted via HTTPS

## Error Handling

The CDN client includes comprehensive error handling:

```typescript
try {
  const url = await uploadFileViaAPI(file, 'private')
} catch (error) {
  if (error.message.includes('API key')) {
    // Handle authentication error
  } else if (error.message.includes('not found')) {
    // Handle file not found
  } else {
    // Handle other errors
  }
}
```

## Troubleshooting

### "CDN API key is not configured"

**Solution**: Add `CDN_API_KEY` to your `.env.local` file and restart the dev server.

### "Unauthorized: Invalid or missing API key"

**Solution**: Verify your API key is correct and has proper permissions.

### "File not found"

**Solution**: Ensure the filename exists on the CDN server.

### Upload fails with no error

**Solution**: 
1. Check file size (must be < 50MB)
2. Verify network connectivity to CDN
3. Check browser console for CORS errors

## Testing

### Test Upload

```typescript
// Test in browser console
const input = document.createElement('input')
input.type = 'file'
input.onchange = async (e) => {
  const file = e.target.files[0]
  const { uploadFileViaAPI } = await import('./lib/cdn-client')
  const url = await uploadFileViaAPI(file, 'private')
  console.log('Uploaded:', url)
}
input.click()
```

### Test Delete

```typescript
// Test in browser console
const { deleteFileViaAPI } = await import('./lib/cdn-client')
await deleteFileViaAPI('https://cdn.tripbooking.ai/files/test.pdf')
console.log('Deleted successfully')
```

## Future Enhancements

- [ ] Add file type validation
- [ ] Implement file compression before upload
- [ ] Add progress tracking for large files
- [ ] Implement batch upload/delete operations
- [ ] Add file preview functionality
- [ ] Create admin dashboard for file management
- [ ] Add automatic cleanup of orphaned files
- [ ] Implement CDN cache management

## Support

For issues or questions:
- Check this documentation
- Review the CDN API documentation
- Contact the development team
- Submit an issue in the repository

## License

This integration is part of the accounting-webapp project. Refer to the main project license.
