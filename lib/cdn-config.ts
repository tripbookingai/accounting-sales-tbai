/**
 * CDN Configuration
 * 
 * Centralized configuration for CDN file management.
 * Adjust these values based on your CDN server limits.
 */

/**
 * Maximum file size for uploads in bytes
 * 
 * Default: 10MB
 * 
 * Note: This should match or be less than your CDN server's upload limit.
 * If you're getting 413 errors, try reducing this value.
 * 
 * Common sizes:
 * - 5MB:  5 * 1024 * 1024
 * - 10MB: 10 * 1024 * 1024
 * - 20MB: 20 * 1024 * 1024
 * - 50MB: 50 * 1024 * 1024
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Get human-readable file size
 */
export function getMaxFileSizeMB(): number {
  return Math.round(MAX_FILE_SIZE / 1024 / 1024)
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

/**
 * Validate if file size is within limit
 */
export function isFileSizeValid(fileSize: number): boolean {
  return fileSize <= MAX_FILE_SIZE
}

/**
 * Get error message for oversized file
 */
export function getFileSizeError(fileSize: number): string {
  const sizeMB = (fileSize / 1024 / 1024).toFixed(2)
  const maxSizeMB = getMaxFileSizeMB()
  return `File size (${sizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
}
