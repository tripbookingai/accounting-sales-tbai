# CDN Integration - Quick Reference

## 🚀 Quick Start

```bash
# 1. Add to .env.local
CDN_API_KEY=your_secret_api_key_here
NEXT_PUBLIC_CDN_BASE_URL=https://cdn.tripbooking.ai

# 2. Restart dev server
npm run dev
```

## 📦 Upload File

```typescript
import { uploadFileViaAPI } from '@/lib/cdn-client'

const url = await uploadFileViaAPI(file, 'private')
// Returns: https://cdn.tripbooking.ai/files/a1b2c3d4.pdf
```

## 🗑️ Delete File

```typescript
import { deleteFileViaAPI } from '@/lib/cdn-client'

await deleteFileViaAPI(url)
```

## 📥 Download File (Server-side)

```typescript
import { downloadFile } from '@/lib/cdn-client'

const blob = await downloadFile('filename.pdf', true) // true = private
```

## 🔧 Helper Functions

```typescript
import { extractFilename, isCDNUrl, getCDNUrl } from '@/lib/cdn-client'

// Get filename from URL
const filename = extractFilename(url)
// => 'a1b2c3d4.pdf'

// Check if CDN URL
const isCDN = isCDNUrl(url)
// => true

// Build CDN URL
const fullUrl = getCDNUrl('a1b2c3d4.pdf')
// => 'https://cdn.tripbooking.ai/files/a1b2c3d4.pdf'
```

## 🎨 UI Components

### File List with Delete

```tsx
import { FileAttachmentList } from '@/components/file-attachment'

<FileAttachmentList
  urls={attachmentUrls}
  onRemove={(url) => setAttachmentUrls(prev => prev.filter(u => u !== url))}
  showDelete={true}
  showDownload={true}
/>
```

### Upload Zone

```tsx
import { FileUploadZone } from '@/components/file-attachment'

<FileUploadZone
  onFilesSelected={async (files) => {
    for (const file of files) {
      const url = await uploadFileViaAPI(file, 'private')
      setAttachmentUrls(prev => [...prev, url])
    }
  }}
  accept="image/*,.pdf"
  multiple={true}
  maxSize={50 * 1024 * 1024}
/>
```

### Single File Item

```tsx
import { FileAttachmentItem } from '@/components/file-attachment'

<FileAttachmentItem
  url={fileUrl}
  onRemove={(url) => removeFile(url)}
  showDelete={true}
  showDownload={true}
/>
```

## 🔌 API Routes

### POST /api/upload

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.pdf" \
  -F "visibility=private"

# Response:
{
  "url": "https://cdn.tripbooking.ai/files/abc123.pdf",
  "filename": "abc123.pdf",
  "visibility": "private"
}
```

### DELETE /api/upload

```bash
curl -X DELETE "http://localhost:3000/api/upload?filename=abc123.pdf"

# Response:
{
  "message": "abc123.pdf deleted successfully",
  "filename": "abc123.pdf"
}
```

## 🧪 Testing

### Quick Test (Browser Console)

```javascript
// Load the test utility
const { quickTest } = await import('/lib/cdn-test-utils')

// Run quick test
await quickTest()
// ✅ Upload successful! URL: https://...
// ✅ Delete successful!
// 🎉 Quick test complete!
```

### Full Test Suite

```javascript
const { runCDNTests } = await import('/lib/cdn-test-utils')
await runCDNTests()
// Runs all 5 tests and shows results
```

## ⚠️ Common Errors

### "CDN API key is not configured"
```bash
# Fix: Add to .env.local
CDN_API_KEY=your_key_here

# Then restart dev server
npm run dev
```

### "Unauthorized: Invalid or missing API key"
```bash
# Check:
1. API key is correct
2. API key is in .env.local (not .env.example)
3. Dev server was restarted after adding key
```

### Upload fails silently
```bash
# Check:
1. File size < 50MB
2. Browser console for errors
3. Network tab for failed requests
4. CDN service is accessible
```

## 📊 File Size Limits

```typescript
// Default CDN limit
50MB = 50 * 1024 * 1024 bytes

// In component
<FileUploadZone maxSize={50 * 1024 * 1024} />
```

## 🔒 Security

```typescript
// ✅ DO: Use private for sensitive files
await uploadFileViaAPI(file, 'private')

// ✅ DO: Store API key server-side only
// .env.local (not .env)
CDN_API_KEY=secret

// ❌ DON'T: Expose API key to client
// ❌ DON'T: Commit .env.local to git
// ❌ DON'T: Use public for sensitive files
```

## 🔗 File Visibility

```typescript
// Private file (default)
await uploadFileViaAPI(file, 'private')
// Requires API key to download

// Public file
await uploadFileViaAPI(file, 'public')
// Anyone can download without API key
```

## 📁 File Types

```typescript
// All file types supported
const acceptTypes = {
  images: "image/*",
  pdf: ".pdf",
  documents: ".pdf,.doc,.docx",
  excel: ".xls,.xlsx",
  all: "*/*"
}

<FileUploadZone accept={acceptTypes.pdf} />
```

## 🎯 Best Practices

```typescript
// ✅ Handle errors
try {
  const url = await uploadFileViaAPI(file, 'private')
} catch (error) {
  console.error('Upload failed:', error)
  alert('Failed to upload file')
}

// ✅ Validate before upload
if (file.size > 50 * 1024 * 1024) {
  alert('File too large (max 50MB)')
  return
}

// ✅ Show loading state
setUploading(true)
try {
  const url = await uploadFileViaAPI(file, 'private')
} finally {
  setUploading(false)
}

// ✅ Clean up on delete
const handleDelete = async (url: string) => {
  await deleteFileViaAPI(url) // Delete from CDN
  setUrls(prev => prev.filter(u => u !== url)) // Remove from state
}
```

## 📚 Documentation

- Full Docs: `docs/CDN_INTEGRATION.md`
- Setup Guide: `CDN_SETUP.md`
- Deployment: `DEPLOYMENT_CHECKLIST.md`

## 🆘 Support

1. Check browser console for errors
2. Review documentation
3. Run test suite: `runCDNTests()`
4. Check network tab in DevTools
5. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-07
