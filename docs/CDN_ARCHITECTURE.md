# CDN Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Client                         │
│                                                                   │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │  Expense Form    │      │   Sales Form     │                │
│  │  Component       │      │   Component      │                │
│  └────────┬─────────┘      └────────┬─────────┘                │
│           │                          │                           │
│           └──────────┬───────────────┘                           │
│                      │                                           │
│           ┌──────────▼──────────┐                               │
│           │  uploadFileViaAPI() │  (Client-side)                │
│           │  deleteFileViaAPI() │                               │
│           └──────────┬──────────┘                               │
└──────────────────────┼───────────────────────────────────────────┘
                       │ HTTP Request
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                    Next.js Application                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │             API Routes (app/api/upload/)                 │   │
│  │                                                           │   │
│  │  POST   /api/upload        ─┐                           │   │
│  │  DELETE /api/upload?file=x  │                           │   │
│  └─────────────────────────────┼───────────────────────────┘   │
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────┐   │
│  │           CDN Client (lib/cdn-client.ts)                 │   │
│  │                                                           │   │
│  │  - uploadFile()       [Server-side]                      │   │
│  │  - deleteFile()       [Server-side]                      │   │
│  │  - downloadFile()     [Server-side]                      │   │
│  │  - Helper functions                                      │   │
│  └──────────────────────────────┬───────────────────────────┘   │
│                                  │ Uses CDN_API_KEY              │
└──────────────────────────────────┼───────────────────────────────┘
                                   │ HTTPS Request
                                   │ + X-API-KEY Header
┌──────────────────────────────────▼───────────────────────────────┐
│                  TripBooking CDN Service                          │
│                  https://cdn.tripbooking.ai                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  POST   /upload                                            │ │
│  │  GET    /files/<filename>                                  │ │
│  │  DELETE /delete/<filename>                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    File Storage                             │ │
│  │                                                             │ │
│  │  Private Files: Require API key                            │ │
│  │  Public Files:  No authentication needed                   │ │
│  │                                                             │ │
│  │  Files stored as: <uuid>.<extension>                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Upload Flow

```
1. User selects file in form
   ↓
2. uploadFileViaAPI(file, 'private')
   ↓
3. POST /api/upload with FormData
   ↓
4. API Route extracts file
   ↓
5. uploadFile() called (server-side)
   ↓
6. POST https://cdn.tripbooking.ai/upload
   Headers: X-API-KEY: <secret>
   Body: file + visibility
   ↓
7. CDN processes and stores file
   ↓
8. CDN returns: { url, filename, visibility }
   ↓
9. API Route returns URL to client
   ↓
10. Client stores URL in state
    ↓
11. URL saved to database with expense/sale record
```

### Download Flow

```
1. User clicks download button
   ↓
2. window.open(url, '_blank')
   ↓
3. Browser makes request to CDN
   ↓
4. GET https://cdn.tripbooking.ai/files/<filename>
   Headers: X-API-KEY: <secret> (if private)
   ↓
5. CDN validates API key (if private)
   ↓
6. CDN returns file blob
   ↓
7. Browser downloads file
```

### Delete Flow

```
1. User clicks delete button
   ↓
2. deleteFileViaAPI(url)
   ↓
3. Extract filename from URL
   ↓
4. DELETE /api/upload?filename=<filename>
   ↓
5. API Route extracts filename
   ↓
6. deleteFile() called (server-side)
   ↓
7. DELETE https://cdn.tripbooking.ai/delete/<filename>
   Headers: X-API-KEY: <secret>
   ↓
8. CDN deletes file
   ↓
9. CDN returns: { message, filename }
   ↓
10. API Route returns success to client
    ↓
11. Client removes URL from state
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Form Components                              │
│                                                                   │
│  ┌──────────────────────┐     ┌──────────────────────┐          │
│  │  ExpenseForm         │     │  SalesForm           │          │
│  │                      │     │                      │          │
│  │  - File selection    │     │  - File selection    │          │
│  │  - Upload handling   │     │  - Upload handling   │          │
│  │  - URL storage       │     │  - URL storage       │          │
│  └──────────┬───────────┘     └──────────┬───────────┘          │
│             │                             │                      │
│             └─────────────┬───────────────┘                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            │ Uses
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                  File Attachment Components                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FileUploadZone                                            │ │
│  │  - Drag and drop area                                      │ │
│  │  - File selection                                          │ │
│  │  - Validation                                              │ │
│  │  - Error handling                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FileAttachmentList                                        │ │
│  │  - Display multiple files                                  │ │
│  │  - Pagination                                              │ │
│  │  - Bulk actions                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FileAttachmentItem                                        │ │
│  │  - Single file display                                     │ │
│  │  - Download button                                         │ │
│  │  - Delete button                                           │ │
│  │  - Loading states                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Security Layers                            │
│                                                                   │
│  Layer 1: Client-Side                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  - File size validation (50MB)                             │ │
│  │  - File type checking (optional)                           │ │
│  │  - No API key exposure                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Layer 2: Next.js API Route                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  - Server-side API key storage                             │ │
│  │  - Request validation                                      │ │
│  │  - Error sanitization                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Layer 3: CDN Service                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  - API key authentication                                  │ │
│  │  - File size enforcement (50MB)                            │ │
│  │  - UUID-based filenames                                    │ │
│  │  - Private/Public access control                           │ │
│  │  - HTTPS encryption                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Environment Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Environment Variables                          │
│                                                                   │
│  Development (.env.local)                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CDN_API_KEY=dev_key_12345                                 │ │
│  │  NEXT_PUBLIC_CDN_BASE_URL=https://cdn.tripbooking.ai       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Production (Platform Settings)                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CDN_API_KEY=prod_key_67890                                │ │
│  │  NEXT_PUBLIC_CDN_BASE_URL=https://cdn.tripbooking.ai       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Access Pattern:                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Server-side: process.env.CDN_API_KEY                      │ │
│  │  Client-side: process.env.NEXT_PUBLIC_CDN_BASE_URL         │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      Database Tables                              │
│                                                                   │
│  expenses                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  id                    UUID PRIMARY KEY                     │ │
│  │  user_id               UUID                                 │ │
│  │  ...other fields...                                         │ │
│  │  attachment_urls       TEXT[]  ◄─── CDN URLs stored here   │ │
│  │  created_at            TIMESTAMP                            │ │
│  │  updated_at            TIMESTAMP                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  sales                                                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  id                    UUID PRIMARY KEY                     │ │
│  │  user_id               UUID                                 │ │
│  │  ...other fields...                                         │ │
│  │  attachment_urls       TEXT[]  ◄─── CDN URLs stored here   │ │
│  │  created_at            TIMESTAMP                            │ │
│  │  updated_at            TIMESTAMP                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Example attachment_urls value:                                  │
│  [                                                               │
│    "https://cdn.tripbooking.ai/files/a1b2c3d4.pdf",            │
│    "https://cdn.tripbooking.ai/files/e5f6g7h8.jpg"             │
│  ]                                                               │
└───────────────────────────────────────────────────────────────────┘
```

## File Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                       File Lifecycle                              │
│                                                                   │
│  1. CREATION                                                     │
│     User selects file ──► File object created                   │
│                                                                   │
│  2. VALIDATION                                                   │
│     Check size ──► Check type ──► Pass validation               │
│                                                                   │
│  3. UPLOAD                                                       │
│     Upload to CDN ──► Generate UUID filename                    │
│                                                                   │
│  4. STORAGE                                                      │
│     Store on CDN ──► Return URL                                 │
│                                                                   │
│  5. DATABASE                                                     │
│     Save URL to database ──► Part of expense/sale record        │
│                                                                   │
│  6. DISPLAY                                                      │
│     Show in list ──► Download link ──► Delete option            │
│                                                                   │
│  7. DELETION                                                     │
│     User deletes ──► Remove from CDN ──► Remove from DB         │
│                                                                   │
│  8. CLEANUP                                                      │
│     Orphaned files can be cleaned up periodically               │
└───────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Error Handling Strategy                       │
│                                                                   │
│  Client-Side Errors                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  File too large        ──► Show error message               │ │
│  │  Invalid file type     ──► Show error message               │ │
│  │  Network error         ──► Retry option + error message     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  API Route Errors                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Missing file          ──► 400 Bad Request                  │ │
│  │  Upload failed         ──► 500 Server Error                 │ │
│  │  CDN unavailable       ──► 503 Service Unavailable          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  CDN Service Errors                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Invalid API key       ──► 401 Unauthorized                 │ │
│  │  File not found        ──► 404 Not Found                    │ │
│  │  Server error          ──► 500 Server Error                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Error Display                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  - User-friendly messages                                   │ │
│  │  - No sensitive information leaked                          │ │
│  │  - Actionable suggestions                                   │ │
│  │  - Log full error for debugging                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     System Integration Points                     │
│                                                                   │
│  Frontend                                                        │
│  ├── Expense Form ──────────┐                                   │
│  ├── Sales Form ─────────────┼──► CDN Client (uploadFileViaAPI) │
│  └── File Components ────────┘                                   │
│                                                                   │
│  Backend                                                         │
│  ├── API Routes ─────────────┐                                  │
│  └── CDN Client ──────────────┼──► TripBooking CDN Service      │
│                                                                   │
│  Database                                                        │
│  ├── Expenses Table ─────────┐                                  │
│  └── Sales Table ─────────────┼──► attachment_urls column       │
│                                                                   │
│  External Services                                               │
│  └── TripBooking CDN ─────────► File Storage + Management       │
└───────────────────────────────────────────────────────────────────┘
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Optimization                       │
│                                                                   │
│  Upload Optimization                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  - Sequential uploads (current)                             │ │
│  │  - Future: Parallel uploads                                 │ │
│  │  - Future: Chunked uploads for large files                  │ │
│  │  - Future: Upload progress tracking                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Download Optimization                                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  - Direct CDN links (no proxy)                              │ │
│  │  - Browser caching                                          │ │
│  │  - Future: Image optimization                               │ │
│  │  - Future: Lazy loading                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Network Optimization                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  - HTTPS/2 support                                          │ │
│  │  - CDN edge locations                                       │ │
│  │  - Connection pooling                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

---

**Document Version**: 1.0.0  
**Last Updated**: January 7, 2025  
**Status**: Current
