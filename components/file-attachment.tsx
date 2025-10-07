"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Download, FileIcon, Loader2, Eye } from "lucide-react"
import { deleteFileViaAPI, downloadFileViaAPI, extractFilename, isCDNUrl } from "@/lib/cdn-client"
import { MAX_FILE_SIZE } from "@/lib/cdn-config"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FileAttachmentItemProps {
  url: string
  onRemove?: (url: string) => void
  showDelete?: boolean
  showDownload?: boolean
  showView?: boolean
}

export function FileAttachmentItem({ 
  url, 
  onRemove, 
  showDelete = true,
  showDownload = true,
  showView = true
}: FileAttachmentItemProps) {
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  const filename = extractFilename(url)
  const displayName = filename || url.split('/').pop() || 'file'
  
  // Determine file type
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)
  const isPDF = /\.pdf$/i.test(url)
  const canPreview = isImage || isPDF

  // Create authenticated proxy URL for viewing
  const viewUrl = `/api/upload?filename=${encodeURIComponent(filename)}`

  const handleDelete = async () => {
    if (!onRemove) return
    
    setDeleting(true)
    setError(null)
    
    try {
      if (isCDNUrl(url)) {
        await deleteFileViaAPI(url)
      }
      onRemove(url)
    } catch (err) {
      console.error('Delete failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete file')
      setDeleting(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    
    try {
      await downloadFileViaAPI(url, displayName)
    } catch (err) {
      console.error('Download failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to download file')
    } finally {
      setDownloading(false)
    }
  }

  const handleView = () => {
    setViewModalOpen(true)
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md">
          <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate flex-1 min-w-0">
            {displayName}
          </span>
          <div className="flex gap-1 flex-shrink-0">
            {showView && canPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="h-6 w-6 p-0"
                title="View file"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            {showDownload && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
                className="h-6 w-6 p-0"
                title="Download file"
              >
                {downloading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
              </Button>
            )}
            {showDelete && onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                title="Delete file"
              >
                {deleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
            <DialogDescription>{displayName}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {isImage && (
              <img 
                src={viewUrl} 
                alt={displayName} 
                className="max-w-full h-auto rounded-lg"
              />
            )}
            {isPDF && (
              <iframe
                src={viewUrl}
                className="w-full h-[70vh] border rounded-lg"
                title={displayName}
              />
            )}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download
            </Button>
            <Button
              variant="outline"
              onClick={() => setViewModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface FileAttachmentListProps {
  urls: string[]
  onRemove?: (url: string) => void
  showDelete?: boolean
  showDownload?: boolean
  showView?: boolean
  maxDisplay?: number
}

export function FileAttachmentList({ 
  urls, 
  onRemove, 
  showDelete = true,
  showDownload = true,
  showView = true,
  maxDisplay 
}: FileAttachmentListProps) {
  const [showAll, setShowAll] = useState(false)
  
  if (!urls || urls.length === 0) {
    return null
  }

  const displayUrls = maxDisplay && !showAll ? urls.slice(0, maxDisplay) : urls
  const hasMore = maxDisplay && urls.length > maxDisplay

  return (
    <div className="space-y-2">
      {displayUrls.map((url, index) => (
        <FileAttachmentItem
          key={`${url}-${index}`}
          url={url}
          onRemove={onRemove}
          showDelete={showDelete}
          showDownload={showDownload}
          showView={showView}
        />
      ))}
      {hasMore && !showAll && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full text-xs"
        >
          Show {urls.length - maxDisplay} more file{urls.length - maxDisplay > 1 ? 's' : ''}
        </Button>
      )}
      {hasMore && showAll && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(false)}
          className="w-full text-xs"
        >
          Show less
        </Button>
      )}
    </div>
  )
}

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  disabled?: boolean
}

export function FileUploadZone({
  onFilesSelected,
  accept = "*/*",
  multiple = true,
  maxSize = MAX_FILE_SIZE, // Use config default (10MB)
  disabled = false
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        errors.push(`${file.name} is too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      setError(errors.join(', '))
    } else {
      setError(null)
    }

    return validFiles
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const validFiles = validateFiles(files)
    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    
    handleFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return
    
    handleFiles(e.target.files)
  }

  return (
    <div className="space-y-2">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center
          transition-colors duration-200
          ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="space-y-2">
          <div className="flex justify-center">
            <FileIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-muted-foreground">
            Max file size: {Math.round(maxSize / 1024 / 1024)}MB
          </div>
        </div>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
