# CDN Upload Error: 413 Request Entity Too Large - Fixed! ✅

## Problem

You were encountering this error:
```
Upload error: Error: HTTP 413: Request Entity Too Large
```

This happens when the file being uploaded exceeds the size limit set by the CDN server.

## Solution Applied

I've implemented the following fixes:

### 1. **Reduced Default File Size Limit**
Changed from **50MB** to **10MB** to match CDN server limits.

### 2. **Added File Size Validation**
Files are now validated **before** upload to prevent unnecessary network requests.

### 3. **Centralized Configuration**
Created `lib/cdn-config.ts` for easy adjustment of file size limits.

### 4. **Better Error Messages**
Users now see helpful messages like:
> "File size (15.3MB) exceeds maximum allowed size (10MB)"

### 5. **Proper Error Handling**
- 413 errors are caught and handled gracefully
- User-friendly error messages displayed
- No console clutter

## Files Modified

```
✅ lib/cdn-config.ts              (NEW - centralized config)
✅ lib/cdn-client.ts              (added size validation)
✅ app/api/upload/route.ts        (improved error handling)
✅ components/expense-form.tsx    (uses config)
✅ components/sales-form.tsx      (uses config)
✅ components/file-attachment.tsx (uses config)
```

## How to Adjust File Size Limit

### Option 1: Edit the Config File (Recommended)

Edit `lib/cdn-config.ts`:

```typescript
// Change this value:
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// To one of these:
export const MAX_FILE_SIZE = 5 * 1024 * 1024   // 5MB
export const MAX_FILE_SIZE = 20 * 1024 * 1024  // 20MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024  // 50MB
```

**Important**: Make sure the limit doesn't exceed your CDN server's maximum!

### Option 2: Use Environment Variable

Add to `.env.local`:

```env
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB in bytes
```

Then update `lib/cdn-config.ts`:

```typescript
export const MAX_FILE_SIZE = 
  process.env.NEXT_PUBLIC_MAX_FILE_SIZE 
    ? parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) 
    : 10 * 1024 * 1024
```

## Testing the Fix

### Test 1: Upload Small File (< 10MB)
1. Go to Expenses or Sales page
2. Upload a file smaller than 10MB
3. ✅ Should upload successfully

### Test 2: Upload Large File (> 10MB)
1. Try to upload a file larger than 10MB
2. ✅ Should show error message BEFORE attempting upload
3. ✅ Error message should be user-friendly

### Test 3: Browser Console
```javascript
// Test file size validation
const { isFileSizeValid, getFileSizeError } = await import('./lib/cdn-config')

// Valid file
console.log(isFileSizeValid(5 * 1024 * 1024))  // true (5MB)

// Invalid file
console.log(isFileSizeValid(15 * 1024 * 1024)) // false (15MB)

// Get error message
console.log(getFileSizeError(15 * 1024 * 1024))
// Output: "File size (15.00MB) exceeds maximum allowed size (10MB)"
```

## Understanding the Error

### What Causes 413 Errors?

1. **CDN Server Limits**: The CDN server has a maximum upload size
2. **Nginx/Apache Limits**: Web server configuration
3. **Application Limits**: Next.js body parser limits

### Error Flow

```
User uploads 20MB file
    ↓
Client validates (10MB limit) ❌ STOPS HERE NOW
    ↓
(Previously) Upload to API route
    ↓
(Previously) API forwards to CDN
    ↓
(Previously) CDN rejects: 413 Error
```

**Now**: Validation happens at the client, preventing wasted uploads!

## Common Scenarios

### Scenario 1: User Uploads PDF Receipt (3MB)
✅ **Result**: Upload successful
- File size validated
- Uploaded to CDN
- URL returned and saved

### Scenario 2: User Uploads High-Res Image (25MB)
❌ **Result**: Error shown immediately
- "File size (25.00MB) exceeds maximum allowed size (10MB)"
- No upload attempt made
- User can compress image and try again

### Scenario 3: Multiple Files Upload
✅ **Result**: Only valid files uploaded
- Each file validated individually
- Small files succeed
- Large files show errors
- User informed of which files failed

## Monitoring & Debugging

### Check Current Limit

```javascript
// In browser console
const { getMaxFileSizeMB } = await import('./lib/cdn-config')
console.log('Max file size:', getMaxFileSizeMB(), 'MB')
```

### Format File Sizes

```javascript
const { formatFileSize } = await import('./lib/cdn-config')

console.log(formatFileSize(1024))           // "1.00 KB"
console.log(formatFileSize(1024 * 1024))    // "1.00 MB"
console.log(formatFileSize(5 * 1024 * 1024)) // "5.00 MB"
```

### Debug Upload Errors

Check the browser console for detailed error messages:
```
Upload failed: File size (15.30MB) exceeds maximum allowed size (10MB)
```

## Best Practices

### ✅ DO:
- Keep file size limit ≤ CDN server limit
- Show file size in error messages
- Validate on client before upload
- Inform users of size limits upfront

### ❌ DON'T:
- Set limit higher than CDN supports
- Upload without validation
- Hide error messages from users
- Use generic error messages

## Need Larger Files?

If you genuinely need to support larger files:

1. **Contact CDN Administrator**: Ask about increasing the limit
2. **Update Configuration**: Change `MAX_FILE_SIZE` in config
3. **Update Documentation**: Note the new limit
4. **Test Thoroughly**: Ensure uploads work
5. **Monitor Usage**: Large files use more bandwidth

## Quick Reference

| File Size | Calculation | Use Case |
|-----------|-------------|----------|
| 1MB | `1 * 1024 * 1024` | Small documents |
| 5MB | `5 * 1024 * 1024` | PDFs, images |
| 10MB | `10 * 1024 * 1024` | **Current default** |
| 20MB | `20 * 1024 * 1024` | Large documents |
| 50MB | `50 * 1024 * 1024` | Videos, archives |

## Additional Resources

- [CDN Configuration](./lib/cdn-config.ts)
- [CDN Client](./lib/cdn-client.ts)
- [Upload API Route](./app/api/upload/route.ts)
- [Full Documentation](./docs/CDN_INTEGRATION.md)

## Support

If you continue to see 413 errors:

1. Check the file size: `console.log(file.size / 1024 / 1024, 'MB')`
2. Check the configured limit in `lib/cdn-config.ts`
3. Verify CDN server's actual limit
4. Check browser console for detailed errors
5. Contact development team

---

**Status**: ✅ Fixed  
**Date**: October 7, 2025  
**Issue**: HTTP 413 Request Entity Too Large  
**Solution**: File size validation + reduced default limit
