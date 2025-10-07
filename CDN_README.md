# 📦 CDN File Management Integration

Complete file management integration using the TripBooking CDN service for the accounting webapp.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [Support](#support)

## 🎯 Overview

This integration replaces local file storage with a secure, scalable CDN service. Files are uploaded to `https://cdn.tripbooking.ai` with UUID-based filenames and support for both public and private access.

### What's Included

- ✅ Complete CDN API client
- ✅ Next.js API routes for uploads/deletes
- ✅ Reusable UI components
- ✅ Integration with expense and sales forms
- ✅ Comprehensive documentation
- ✅ Test utilities
- ✅ Deployment checklist

## ✨ Features

### Core Functionality
- 🔐 **Secure uploads** with API key authentication
- 🔒 **Private files** by default (requires API key for access)
- 🌐 **Public files** option for non-sensitive data
- 🎯 **UUID filenames** to prevent conflicts
- 📦 **50MB file size** limit (configurable on server)
- 🗑️ **Delete support** with automatic cleanup
- 📥 **Download support** with direct CDN links
- ⚡ **Fast delivery** via CDN

### UI Components
- 📋 File attachment list with management
- 📎 Individual file items with actions
- 🎨 Drag-and-drop upload zone
- 💫 Loading states and error handling
- 📱 Responsive design

### Security
- 🔑 Server-side API key storage
- 🔐 HTTPS communication
- 🚫 No sensitive data exposure
- ✅ File validation
- 🛡️ Error sanitization

## 🚀 Quick Start

### 1. Configure Environment

Create `.env.local`:

```env
CDN_API_KEY=your_secret_api_key_here
NEXT_PUBLIC_CDN_BASE_URL=https://cdn.tripbooking.ai
```

### 2. Restart Development Server

```bash
npm run dev
```

### 3. Test It Out

1. Go to Expenses or Sales page
2. Create a new record
3. Upload a file attachment
4. Verify the URL starts with `https://cdn.tripbooking.ai`

That's it! 🎉

## 📚 Documentation

### Comprehensive Guides

| Document | Description |
|----------|-------------|
| [CDN_INTEGRATION.md](./docs/CDN_INTEGRATION.md) | Complete integration guide with examples |
| [CDN_SETUP.md](./CDN_SETUP.md) | Step-by-step setup instructions |
| [CDN_QUICK_REFERENCE.md](./CDN_QUICK_REFERENCE.md) | Quick reference for common tasks |
| [CDN_ARCHITECTURE.md](./docs/CDN_ARCHITECTURE.md) | System architecture and diagrams |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Deployment verification checklist |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Summary of what was built |

### Quick Links

- **Setup**: [CDN_SETUP.md](./CDN_SETUP.md)
- **API Reference**: [CDN_INTEGRATION.md](./docs/CDN_INTEGRATION.md#api-endpoints)
- **Troubleshooting**: [CDN_INTEGRATION.md](./docs/CDN_INTEGRATION.md#troubleshooting)
- **Security**: [CDN_INTEGRATION.md](./docs/CDN_INTEGRATION.md#security-considerations)

## 🏗️ Architecture

```
Browser/Client
    ↓
Next.js API Routes (/api/upload)
    ↓
CDN Client (lib/cdn-client.ts)
    ↓
TripBooking CDN (cdn.tripbooking.ai)
    ↓
File Storage (UUID-based filenames)
```

### Key Components

1. **CDN Client** (`lib/cdn-client.ts`)
   - Core API functionality
   - Server-side and client-side methods
   - Error handling and validation

2. **API Routes** (`app/api/upload/route.ts`)
   - POST for uploads
   - DELETE for file removal
   - API key authentication

3. **UI Components** (`components/file-attachment.tsx`)
   - FileUploadZone
   - FileAttachmentList
   - FileAttachmentItem

4. **Form Integration**
   - Expense form updated
   - Sales form updated
   - Seamless user experience

## 💻 Usage

### Upload a File

```typescript
import { uploadFileViaAPI } from '@/lib/cdn-client'

const url = await uploadFileViaAPI(file, 'private')
console.log('Uploaded:', url)
// Output: https://cdn.tripbooking.ai/files/a1b2c3d4.pdf
```

### Delete a File

```typescript
import { deleteFileViaAPI } from '@/lib/cdn-client'

await deleteFileViaAPI(url)
console.log('Deleted successfully')
```

### Use in Components

```tsx
import { FileAttachmentList } from '@/components/file-attachment'

<FileAttachmentList
  urls={attachments}
  onRemove={(url) => handleRemove(url)}
  showDelete={true}
  showDownload={true}
/>
```

### Upload Zone

```tsx
import { FileUploadZone } from '@/components/file-attachment'

<FileUploadZone
  onFilesSelected={handleFilesSelected}
  accept="image/*,.pdf"
  multiple={true}
  maxSize={50 * 1024 * 1024}
/>
```

## 🧪 Testing

### Manual Testing

1. Upload a file through the UI
2. Verify the CDN URL format
3. Download the file
4. Delete the file
5. Verify deletion

### Automated Testing

Open browser console:

```javascript
// Quick test
const { quickTest } = await import('/lib/cdn-test-utils')
await quickTest()

// Full test suite
const { runCDNTests } = await import('/lib/cdn-test-utils')
await runCDNTests()
```

### Test Results

The test suite will:
- ✅ Upload a test file
- ✅ Verify URL format
- ✅ Download and verify content
- ✅ Delete the file
- ✅ Confirm deletion

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Set `CDN_API_KEY` in production environment
- [ ] Set `NEXT_PUBLIC_CDN_BASE_URL` if needed
- [ ] Test in staging environment
- [ ] Run full test suite
- [ ] Verify API key works

### Deployment Steps

1. **Configure environment variables** in your hosting platform
2. **Build the application**: `npm run build`
3. **Deploy to production**
4. **Verify functionality** after deployment
5. **Monitor for errors**

### Post-Deployment

- [ ] Test file upload in production
- [ ] Test file download
- [ ] Test file deletion
- [ ] Verify URLs are correct
- [ ] Check for errors in logs

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete checklist.

## 📊 File Structure

```
lib/
├── cdn-client.ts              # Core CDN API client
└── cdn-test-utils.ts          # Testing utilities

components/
└── file-attachment.tsx        # UI components

app/api/upload/
└── route.ts                   # API endpoints

docs/
├── CDN_INTEGRATION.md         # Full documentation
└── CDN_ARCHITECTURE.md        # Architecture diagrams

CDN_SETUP.md                   # Setup guide
CDN_QUICK_REFERENCE.md         # Quick reference
DEPLOYMENT_CHECKLIST.md        # Deployment checklist
IMPLEMENTATION_SUMMARY.md      # Implementation summary
.env.example                   # Environment template
```

## 🔒 Security

### Best Practices

- ✅ API key stored server-side only (never exposed to client)
- ✅ Private files by default
- ✅ HTTPS encryption for all requests
- ✅ File size validation
- ✅ Error messages don't leak sensitive info

### Configuration

```env
# Server-side only (not exposed to browser)
CDN_API_KEY=your_secret_key

# Public (can be accessed from browser)
NEXT_PUBLIC_CDN_BASE_URL=https://cdn.tripbooking.ai
```

**Important**: Never commit `.env.local` to version control!

## 🐛 Troubleshooting

### "CDN API key is not configured"

**Solution**: Add `CDN_API_KEY` to `.env.local` and restart dev server.

### "Unauthorized: Invalid or missing API key"

**Solution**: Verify API key is correct and properly set in environment.

### Upload fails silently

**Check**:
1. File size < 50MB
2. Browser console for errors
3. Network connectivity to CDN
4. API key is valid

See [full troubleshooting guide](./docs/CDN_INTEGRATION.md#troubleshooting) for more solutions.

## 📈 Monitoring

Track these metrics:

- Upload success/failure rates
- File storage usage
- API response times
- Error rates
- Bandwidth usage

## 🔄 Migration from Local Storage

If you have existing files in `public/attachments/`:

1. **Backup** existing files
2. **Create migration script** (see CDN_SETUP.md)
3. **Upload to CDN**
4. **Update database** with new URLs
5. **Verify** all files accessible
6. **Clean up** old local files

See [migration guide](./CDN_SETUP.md#migration-from-local-storage) for details.

## 🤝 Support

### Resources

- 📖 [Full Documentation](./docs/CDN_INTEGRATION.md)
- 🚀 [Setup Guide](./CDN_SETUP.md)
- ⚡ [Quick Reference](./CDN_QUICK_REFERENCE.md)
- 🏗️ [Architecture](./docs/CDN_ARCHITECTURE.md)

### Getting Help

1. Check the documentation
2. Run the test suite
3. Review error logs
4. Contact development team

## 📝 API Reference

### Upload File

```http
POST /api/upload
Content-Type: multipart/form-data

file: File
visibility: "private" | "public"
```

**Response**:
```json
{
  "url": "https://cdn.tripbooking.ai/files/abc123.pdf",
  "filename": "abc123.pdf",
  "visibility": "private"
}
```

### Delete File

```http
DELETE /api/upload?filename=abc123.pdf
```

**Response**:
```json
{
  "message": "abc123.pdf deleted successfully",
  "filename": "abc123.pdf"
}
```

## 🎓 Examples

### Complete Upload Flow

```typescript
import { uploadFileViaAPI } from '@/lib/cdn-client'
import { useState } from 'react'

function MyComponent() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    
    try {
      const uploadedUrl = await uploadFileViaAPI(file, 'private')
      setUrl(uploadedUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {url && <p>Uploaded: <a href={url} target="_blank">{url}</a></p>}
    </div>
  )
}
```

## 📦 Dependencies

No additional dependencies required! Uses native:
- Fetch API
- FormData API
- File API
- Blob API

## 🔖 Version

**Current Version**: 1.0.0  
**Last Updated**: January 7, 2025  
**Status**: ✅ Production Ready

## 📄 License

This integration is part of the accounting-webapp project.

## 🎉 Credits

Developed for the accounting webapp to provide secure, scalable file management using the TripBooking CDN service.

---

**Ready to get started?** → [Read the Setup Guide](./CDN_SETUP.md)

**Need help?** → [Check the Troubleshooting Guide](./docs/CDN_INTEGRATION.md#troubleshooting)

**Want to learn more?** → [View the Architecture](./docs/CDN_ARCHITECTURE.md)
