# Troubleshooting "Unauthorized" Error for File Downloads

## 🔍 Issue
Getting "Unauthorized" or 401 errors when trying to download or view files.

## ✅ Checklist to Fix

### 1. **Verify Environment Variables**

Check that `CDN_API_KEY` is set in `.env.local`:

```bash
cat .env.local | grep CDN_API_KEY
```

Should show:
```
CDN_API_KEY=IBnf5PIqGbNjlRkZr3w2yIUbxi88GcqWA9vqCqfl8fQ
NEXT_PUBLIC_CDN_BASE_URL=https://cdn.tripbooking.ai
```

✅ **Confirmed**: Both variables are correctly set in `.env.local`

---

### 2. **Restart Development Server** ⚠️ **CRITICAL**

Next.js only loads environment variables when the server starts. If you added or modified `.env.local` while the server was running, you **MUST** restart it.

**Steps:**
1. Stop the dev server (Ctrl+C in terminal)
2. Start it again:
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

**Why this matters:**
- Environment variables are loaded at startup
- Changes to `.env.local` are NOT hot-reloaded
- The server will use old/missing values until restart

---

### 3. **Verify API Route Can Access Environment Variable**

After restarting, check the console logs when downloading a file.

You should see:
```
Downloading file: abc123-uuid.jpg
CDN_API_KEY available: true
```

If you see:
```
CDN_API_KEY available: false
```

Then the environment variable is NOT being loaded. Possible causes:
- Server wasn't restarted
- Wrong `.env` file (should be `.env.local`)
- Typo in variable name (should be exactly `CDN_API_KEY`)

---

### 4. **Check Browser Console**

Open browser DevTools (F12) and check:

**Network Tab:**
- Look for requests to `/api/upload?filename=...`
- Status should be `200 OK`
- If `401 Unauthorized`, the server-side API key isn't working
- If `500 Internal Server Error`, check server console for error details

**Console Tab:**
- Look for error messages
- Red errors indicate what went wrong

---

### 5. **Test the API Endpoint Directly**

Test if the API route works:

```bash
curl "http://localhost:3000/api/upload?filename=YOUR_FILE_UUID.jpg"
```

**Expected Result:**
- File downloads successfully
- OR you see a JSON error message with details

**If you get 401:**
- Server can't access CDN_API_KEY
- Check server logs for: `CDN_API_KEY available: false`

**If you get 404:**
- File doesn't exist on CDN
- Check if the filename/UUID is correct

---

### 6. **Verify File URLs in Database**

Check that your expense/sales records have valid CDN URLs:

```sql
-- Check expense attachments
SELECT id, attachment_urls FROM expenses WHERE attachment_urls IS NOT NULL LIMIT 5;

-- Check sales attachments
SELECT id, attachment_urls FROM sales WHERE attachment_urls IS NOT NULL LIMIT 5;
```

URLs should look like:
```
["https://cdn.tripbooking.ai/files/abc123-uuid-def456.jpg"]
```

**Common Issues:**
- Empty arrays: `[]`
- Wrong domain: `https://other-domain.com/...`
- Relative paths: `/files/...` (should be full URL)

---

### 7. **Check CDN API Key Validity**

Test if the API key itself works:

```bash
curl -H "X-API-KEY: IBnf5PIqGbNjlRkZr3w2yIUbxi88GcqWA9vqCqfl8fQ" \
  "https://cdn.tripbooking.ai/files/YOUR_FILE_UUID.jpg"
```

**Expected Result:**
- File downloads successfully

**If you get 401:**
- API key is invalid or expired
- Contact TripBooking support for a new key

---

## 🔧 Quick Fix Steps

### Step 1: Restart the Server

```bash
# In your terminal running Next.js
Ctrl+C  # Stop the server

# Restart it
npm run dev
```

### Step 2: Clear Browser Cache

```
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
```

### Step 3: Try Again

1. Go to an expense or sale with attachments
2. Click the eye icon (👁️) to view
3. Click the download button (⬇️) to download

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized: Invalid or missing API key"

**Cause**: Server can't access `CDN_API_KEY` environment variable

**Solution**:
1. ✅ Verify `.env.local` has `CDN_API_KEY=...`
2. ✅ Restart the development server
3. ✅ Check server console shows `CDN_API_KEY available: true`

---

### Issue: Images/PDFs don't load in modal

**Cause**: Browser trying to load CDN URL directly without authentication

**Solution**: Already fixed in code!
- Modal now uses: `/api/upload?filename=...` (authenticated proxy)
- NOT using: `https://cdn.tripbooking.ai/files/...` (direct CDN)

**Verify**:
1. Open DevTools → Network tab
2. Click eye icon on an attachment
3. Should see request to `/api/upload?filename=...`
4. Should NOT see direct request to `cdn.tripbooking.ai`

---

### Issue: Downloads fail with network error

**Cause**: API route returning error, check server console

**Solution**:
1. Look at server console (terminal running Next.js)
2. Look for "Download error details:" log
3. Fix the specific error shown

**Common errors**:
- `CDN API key is not configured` → Add to `.env.local` and restart
- `File not found` → File was deleted from CDN or wrong filename
- `Failed to download file: HTTP 500` → CDN server error, try again

---

### Issue: Old uploads work but new ones fail

**Cause**: New files uploaded as private but CDN API key not configured

**Solution**:
1. Add `CDN_API_KEY` to `.env.local`
2. Restart server
3. New downloads will work
4. Old files should also work now

---

## 📊 Debugging Checklist

Run through this checklist:

- [ ] `.env.local` file exists
- [ ] `.env.local` contains `CDN_API_KEY=...`
- [ ] `.env.local` contains `NEXT_PUBLIC_CDN_BASE_URL=...`
- [ ] Development server has been restarted after adding env vars
- [ ] Server console shows `CDN_API_KEY available: true` when downloading
- [ ] Browser DevTools Network tab shows requests to `/api/upload?filename=...`
- [ ] No direct requests to `cdn.tripbooking.ai` from browser
- [ ] Server console shows no error messages
- [ ] File URLs in database are valid CDN URLs

---

## 🎯 Expected Behavior

### Viewing Files
```
1. User clicks eye icon (👁️)
2. Modal opens
3. Browser requests: /api/upload?filename=abc123.jpg
4. Server logs: "Downloading file: abc123.jpg"
5. Server logs: "CDN_API_KEY available: true"
6. Server fetches from CDN with API key
7. Image/PDF displays in modal ✅
```

### Downloading Files
```
1. User clicks download button (⬇️)
2. Button shows spinner
3. Browser requests: /api/upload?filename=abc123.jpg
4. Server authenticates with CDN
5. File blob returned to browser
6. Browser triggers download
7. File saved to computer ✅
```

---

## 🚨 Still Having Issues?

### Collect Debug Info

Run these commands and share the output:

```bash
# 1. Check environment variables (redact the actual key value)
cat .env.local | grep CDN

# 2. Check if server is running
ps aux | grep next

# 3. Check for errors in server console
# (copy the last 20 lines from your terminal running npm run dev)

# 4. Check browser console
# (copy any red error messages from DevTools Console)

# 5. Test API endpoint
curl -v "http://localhost:3000/api/upload?filename=test.jpg"
```

### Server Logs to Check

When you try to download/view a file, look for these in server console:

```
Downloading file: [filename]
CDN_API_KEY available: true
```

**If you see**:
```
CDN_API_KEY available: false
```

**Then**: The environment variable is NOT loaded. Restart the server!

---

## ✅ Final Verification

After fixing, test:

1. **Create new expense with attachment** → Upload should work
2. **View the attachment** → Eye icon should show preview
3. **Download the attachment** → Download button should work
4. **Edit the expense** → See existing attachment
5. **Add another attachment** → Multiple files should work

All should work without "Unauthorized" errors! ✅

---

## 📞 Need Help?

If you've tried everything above and still have issues:

1. **Share server logs** (terminal output when downloading)
2. **Share browser console errors** (DevTools Console tab)
3. **Share network logs** (DevTools Network tab, filter for "upload")
4. **Confirm server restart** (did you stop and start npm run dev?)

Most likely cause: **Server needs restart** 🔄

---

**Created**: October 7, 2025  
**Issue**: Unauthorized errors on file downloads  
**Primary Fix**: Restart development server after adding CDN_API_KEY
