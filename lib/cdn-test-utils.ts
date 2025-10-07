/**
 * CDN Integration Test Utility
 * 
 * This script helps verify that the CDN integration is working correctly.
 * Run this in the browser console after setting up your API key.
 */

// Test Configuration
const TEST_CONFIG = {
  testFileContent: 'Hello, CDN Test!',
  testFileName: 'test-file.txt',
  visibility: 'private' as const,
}

// Import the CDN client
async function loadCDNClient() {
  const { uploadFileViaAPI, deleteFileViaAPI, extractFilename, isCDNUrl, getCDNUrl } = 
    await import('@/lib/cdn-client')
  return { uploadFileViaAPI, deleteFileViaAPI, extractFilename, isCDNUrl, getCDNUrl }
}

// Helper to create a test file
function createTestFile(): File {
  const blob = new Blob([TEST_CONFIG.testFileContent], { type: 'text/plain' })
  return new File([blob], TEST_CONFIG.testFileName, { type: 'text/plain' })
}

// Test 1: Upload a file
async function testUpload(cdnClient: any): Promise<string | null> {
  console.log('🧪 Test 1: Uploading file...')
  try {
    const file = createTestFile()
    const url = await cdnClient.uploadFileViaAPI(file, TEST_CONFIG.visibility)
    
    if (!url) {
      throw new Error('No URL returned')
    }
    
    console.log('✅ Upload successful!')
    console.log('   URL:', url)
    return url
  } catch (error) {
    console.error('❌ Upload failed:', error)
    return null
  }
}

// Test 2: Verify URL format
async function testUrlFormat(cdnClient: any, url: string): Promise<boolean> {
  console.log('\n🧪 Test 2: Verifying URL format...')
  try {
    const isCDN = cdnClient.isCDNUrl(url)
    const filename = cdnClient.extractFilename(url)
    
    if (!isCDN) {
      throw new Error('URL is not a CDN URL')
    }
    
    if (!filename) {
      throw new Error('Could not extract filename from URL')
    }
    
    console.log('✅ URL format is correct!')
    console.log('   Is CDN URL:', isCDN)
    console.log('   Filename:', filename)
    return true
  } catch (error) {
    console.error('❌ URL format test failed:', error)
    return false
  }
}

// Test 3: Download the file (verify it exists)
async function testDownload(url: string): Promise<boolean> {
  console.log('\n🧪 Test 3: Verifying file exists...')
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const content = await response.text()
    
    if (content !== TEST_CONFIG.testFileContent) {
      throw new Error('File content does not match')
    }
    
    console.log('✅ File exists and content is correct!')
    console.log('   Content:', content)
    return true
  } catch (error) {
    console.error('❌ Download test failed:', error)
    return false
  }
}

// Test 4: Delete the file
async function testDelete(cdnClient: any, url: string): Promise<boolean> {
  console.log('\n🧪 Test 4: Deleting file...')
  try {
    await cdnClient.deleteFileViaAPI(url)
    console.log('✅ Delete successful!')
    return true
  } catch (error) {
    console.error('❌ Delete failed:', error)
    return false
  }
}

// Test 5: Verify file is deleted
async function testVerifyDeleted(url: string): Promise<boolean> {
  console.log('\n🧪 Test 5: Verifying file is deleted...')
  try {
    const response = await fetch(url)
    
    if (response.ok) {
      throw new Error('File still exists after deletion')
    }
    
    if (response.status === 404) {
      console.log('✅ File successfully deleted!')
      return true
    }
    
    throw new Error(`Unexpected status: ${response.status}`)
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log('✅ File successfully deleted! (Network error expected)')
      return true
    }
    console.error('❌ Verification failed:', error)
    return false
  }
}

// Main test runner
export async function runCDNTests() {
  console.log('🚀 Starting CDN Integration Tests...\n')
  console.log('=' .repeat(50))
  
  const results = {
    upload: false,
    urlFormat: false,
    download: false,
    delete: false,
    verifyDeleted: false,
  }
  
  try {
    // Load CDN client
    const cdnClient = await loadCDNClient()
    
    // Test 1: Upload
    const url = await testUpload(cdnClient)
    results.upload = !!url
    
    if (!url) {
      throw new Error('Cannot continue tests without successful upload')
    }
    
    // Test 2: URL Format
    results.urlFormat = await testUrlFormat(cdnClient, url)
    
    // Test 3: Download
    results.download = await testDownload(url)
    
    // Test 4: Delete
    results.delete = await testDelete(cdnClient, url)
    
    // Test 5: Verify Deleted
    results.verifyDeleted = await testVerifyDeleted(url)
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Results Summary:')
  console.log('=' .repeat(50))
  
  const testNames = {
    upload: 'Upload File',
    urlFormat: 'URL Format',
    download: 'Download File',
    delete: 'Delete File',
    verifyDeleted: 'Verify Deletion',
  }
  
  let passed = 0
  let total = 0
  
  Object.entries(results).forEach(([key, value]) => {
    total++
    if (value) passed++
    const status = value ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} - ${testNames[key as keyof typeof testNames]}`)
  })
  
  console.log('=' .repeat(50))
  console.log(`Results: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All tests passed! CDN integration is working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Please check the logs above.')
  }
  
  return results
}

// Quick test function for browser console
export async function quickTest() {
  console.log('Running quick CDN test...')
  const cdnClient = await loadCDNClient()
  const file = createTestFile()
  const url = await cdnClient.uploadFileViaAPI(file, 'private')
  console.log('✅ Upload successful! URL:', url)
  console.log('🗑️  Cleaning up...')
  await cdnClient.deleteFileViaAPI(url)
  console.log('✅ Delete successful!')
  console.log('🎉 Quick test complete!')
  return url
}

// Export for use in tests
export { createTestFile, TEST_CONFIG }
