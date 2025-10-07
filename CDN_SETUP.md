# CDN Integration Setup Guide

This guide will help you set up the TripBooking CDN integration for file management in your accounting webapp.

## Quick Start

### 1. Install Dependencies (if needed)

No additional dependencies are required. The CDN client uses native `fetch` API.

### 2. Configure Environment Variables

Create a `.env.local` file in the project root (if it doesn't exist):

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local` and add your CDN API key:

```env
CDN_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_CDN_BASE_URL=https://cdn.tripbooking.ai
```

**Important**: Never commit `.env.local` to version control!

### 3. Get Your API Key

Contact your CDN service administrator to obtain an API key.

### 4. Restart Your Development Server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

### 5. Test the Integration

1. Navigate to the Expenses page
2. Create a new expense
3. Try uploading a file attachment
4. Verify the file uploads successfully
5. Check that the file URL starts with `https://cdn.tripbooking.ai`

## What Changed

### Files Added

- `lib/cdn-client.ts` - Core CDN API client
- `components/file-attachment.tsx` - Reusable file management components
- `docs/CDN_INTEGRATION.md` - Comprehensive documentation
- `.env.example` - Example environment variables

### Files Modified

- `app/api/upload/route.ts` - Updated to use CDN instead of local storage
- `components/expense-form.tsx` - Updated to use CDN client
- `components/sales-form.tsx` - Updated to use CDN client

## Features

✅ Upload files to CDN
✅ Private files by default (requires API key)
✅ Automatic file deletion
✅ UUID-based filenames
✅ Support for all file types
✅ Error handling and validation
✅ File size limit (50MB default)
✅ Secure API key management

## API Endpoints

### Upload File
```http
POST /api/upload
Content-Type: multipart/form-data

file: <file>
visibility: "private" | "public" (optional, default: "private")
```

### Delete File
```http
DELETE /api/upload?filename=<uuid-filename>
```

## Usage Examples

### In a React Component

```typescript
import { uploadFileViaAPI, deleteFileViaAPI } from '@/lib/cdn-client'

// Upload
const handleUpload = async (file: File) => {
  try {
    const url = await uploadFileViaAPI(file, 'private')
    console.log('Uploaded to:', url)
  } catch (error) {
    console.error('Upload failed:', error)
  }
}

// Delete
const handleDelete = async (url: string) => {
  try {
    await deleteFileViaAPI(url)
    console.log('Deleted:', url)
  } catch (error) {
    console.error('Delete failed:', error)
  }
}
```

### Using the FileAttachmentList Component

```typescript
import { FileAttachmentList } from '@/components/file-attachment'

function MyComponent() {
  const [attachments, setAttachments] = useState<string[]>([])

  const handleRemove = (url: string) => {
    setAttachments(prev => prev.filter(u => u !== url))
  }

  return (
    <FileAttachmentList
      urls={attachments}
      onRemove={handleRemove}
      showDelete={true}
      showDownload={true}
    />
  )
}
```

### Using the FileUploadZone Component

```typescript
import { FileUploadZone } from '@/components/file-attachment'
import { uploadFileViaAPI } from '@/lib/cdn-client'

function MyComponent() {
  const handleFilesSelected = async (files: File[]) => {
    for (const file of files) {
      const url = await uploadFileViaAPI(file, 'private')
      console.log('Uploaded:', url)
    }
  }

  return (
    <FileUploadZone
      onFilesSelected={handleFilesSelected}
      accept="image/*,.pdf"
      multiple={true}
      maxSize={50 * 1024 * 1024} // 50MB
    />
  )
}
```

## Migration from Local Storage

If you have existing files in `public/attachments/`, you'll need to migrate them:

1. **Backup** your `public/attachments/` directory
2. **Create a migration script** (example below)
3. **Run the migration** to upload files to CDN
4. **Update database** with new CDN URLs
5. **Verify** all files are accessible
6. **Clean up** old local files

Example migration script:

```typescript
// scripts/migrate-attachments.ts
import { uploadFile } from '@/lib/cdn-client'
import { createClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

async function migrate() {
  const attachmentsDir = path.join(process.cwd(), 'public', 'attachments')
  
  if (!fs.existsSync(attachmentsDir)) {
    console.log('No attachments directory found')
    return
  }

  const files = fs.readdirSync(attachmentsDir)
  console.log(`Found ${files.length} files to migrate`)

  for (const filename of files) {
    try {
      const filePath = path.join(attachmentsDir, filename)
      const fileBuffer = fs.readFileSync(filePath)
      const file = new File([fileBuffer], filename)
      
      // Upload to CDN
      const result = await uploadFile(file, 'private')
      console.log(`✓ Migrated: ${filename} -> ${result.url}`)
      
      // Update database records
      // You'll need to implement this based on your schema
      // await updateDatabaseUrl(`/attachments/${filename}`, result.url)
      
    } catch (error) {
      console.error(`✗ Failed to migrate ${filename}:`, error)
    }
  }
}

migrate().then(() => console.log('Migration complete'))
```

## Troubleshooting

### "CDN API key is not configured"

**Cause**: Missing `CDN_API_KEY` in environment variables.

**Solution**:
1. Add `CDN_API_KEY` to `.env.local`
2. Restart your development server

### Upload returns 401 Unauthorized

**Cause**: Invalid or missing API key.

**Solution**:
1. Verify your API key is correct
2. Contact your CDN administrator if the key is expired
3. Check that the key is properly set in `.env.local`

### File upload fails silently

**Cause**: File may be too large or network error.

**Solution**:
1. Check file size (max 50MB)
2. Check browser console for errors
3. Verify network connectivity to `cdn.tripbooking.ai`
4. Check CORS settings if accessing from different domain

### Files not showing in database

**Cause**: Database may not be storing the `attachment_urls` field.

**Solution**:
1. Verify the database column exists
2. Check that the form is submitting the URLs correctly
3. Review the API response to ensure URLs are returned

## Security Best Practices

1. **Never commit `.env.local`** - Add it to `.gitignore`
2. **Use private files** for sensitive documents
3. **Rotate API keys** periodically
4. **Monitor CDN usage** to detect unauthorized access
5. **Validate file types** on upload (client and server)
6. **Implement file size limits** to prevent abuse

## Performance Tips

1. **Use public files** for assets that don't need protection
2. **Implement lazy loading** for file previews
3. **Cache CDN URLs** in your application state
4. **Use batch operations** for multiple files
5. **Implement retry logic** for failed uploads

## Support

For technical support:
- Review the [full documentation](./docs/CDN_INTEGRATION.md)
- Check the [CDN API documentation](#)
- Contact the development team
- Submit issues in the repository

## Next Steps

- [ ] Set up your API key
- [ ] Test file upload/delete functionality
- [ ] Migrate existing files (if any)
- [ ] Update production environment variables
- [ ] Configure CDN settings (if needed)
- [ ] Set up monitoring and alerts

## Additional Resources

- [Full CDN Integration Documentation](./docs/CDN_INTEGRATION.md)
- [CDN API Reference](#) (contact admin for access)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Questions?** Contact the development team or refer to the documentation.
