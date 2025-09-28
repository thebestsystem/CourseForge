'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload, FileText, Image, Video, Music, File, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { documentsApi, Document, DocumentFolder, UploadDocumentRequest } from '@/lib/api/documents'
import { useToast } from '@/components/ui/use-toast'

interface DocumentUploadProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (document: Document) => void
  folders: DocumentFolder[]
  preSelectedFolder?: string
  courseId?: string
}

interface FileWithPreview extends File {
  preview?: string
  id: string
}

interface UploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}

export function DocumentUpload({
  isOpen,
  onClose,
  onSuccess,
  folders,
  preSelectedFolder,
  courseId
}: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(preSelectedFolder || '')
  const [extractText, setExtractText] = useState(true)
  const [generateSummary, setGenerateSummary] = useState(true)
  const [extractKeywords, setExtractKeywords] = useState(true)
  const [detectLanguage, setDetectLanguage] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const { toast } = useToast()

  // File type icons
  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />
    if (type.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />
    if (type.startsWith('audio/')) return <Music className="w-8 h-8 text-green-500" />
    if (type === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />
    if (type.includes('document') || type.includes('text')) return <FileText className="w-8 h-8 text-blue-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file, index) => {
      const fileWithPreview = Object.assign(file, {
        id: `${Date.now()}-${index}`,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      })
      return fileWithPreview
    })
    
    setFiles(prev => [...prev, ...newFiles])
    
    // Auto-fill title if only one file and no title set
    if (newFiles.length === 1 && !title) {
      setTitle(newFiles[0].name.replace(/\.[^/.]+$/, ''))
    }
  }, [title])

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId)
      // Clean up preview URLs
      prev.forEach(f => {
        if (f.preview && f.id === fileId) {
          URL.revokeObjectURL(f.preview)
        }
      })
      return newFiles
    })
    setUploadProgress(prev => prev.filter(p => p.fileId !== fileId))
  }

  // Validate form
  const validateForm = (): string | null => {
    if (files.length === 0) return 'Please select at least one file'
    if (!title.trim()) return 'Please enter a title'
    return null
  }

  // Handle upload
  const handleUpload = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    const initialProgress = files.map(file => ({
      fileId: file.id,
      progress: 0,
      status: 'uploading' as const
    }))
    setUploadProgress(initialProgress)

    try {
      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileTitle = files.length === 1 ? title : `${title} - ${file.name}`

        try {
          // Update progress to uploading
          setUploadProgress(prev => prev.map(p => 
            p.fileId === file.id 
              ? { ...p, progress: 10, status: 'uploading' }
              : p
          ))

          const uploadRequest: UploadDocumentRequest = {
            file: file,
            title: fileTitle,
            description: description || undefined,
            courseId: courseId,
            folderId: selectedFolder || undefined,
            extractText,
            generateSummary,
            extractKeywords,
            detectLanguage
          }

          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => prev.map(p => 
              p.fileId === file.id && p.progress < 80
                ? { ...p, progress: Math.min(p.progress + 10, 80) }
                : p
            ))
          }, 200)

          const document = await documentsApi.uploadDocument(uploadRequest)

          clearInterval(progressInterval)

          // Update to processing
          setUploadProgress(prev => prev.map(p => 
            p.fileId === file.id 
              ? { ...p, progress: 90, status: 'processing' }
              : p
          ))

          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Complete
          setUploadProgress(prev => prev.map(p => 
            p.fileId === file.id 
              ? { ...p, progress: 100, status: 'complete' }
              : p
          ))

          onSuccess(document)

        } catch (error) {
          console.error('Upload failed for file:', file.name, error)
          setUploadProgress(prev => prev.map(p => 
            p.fileId === file.id 
              ? { 
                  ...p, 
                  progress: 0, 
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : p
          ))
        }
      }

      // If all uploads completed successfully
      const allCompleted = uploadProgress.every(p => p.status === 'complete')
      if (allCompleted) {
        toast({
          title: "Upload Complete",
          description: `${files.length} file(s) uploaded successfully.`
        })
        
        // Reset form after successful upload
        setTimeout(() => {
          handleClose()
        }, 1500)
      }

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "An error occurred during upload. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Handle close
  const handleClose = () => {
    // Clean up preview URLs
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    
    setFiles([])
    setTitle('')
    setDescription('')
    setSelectedFolder(preSelectedFolder || '')
    setExtractText(true)
    setGenerateSummary(true)
    setExtractKeywords(true)
    setDetectLanguage(true)
    setUploadProgress([])
    setIsUploading(false)
    onClose()
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
      'audio/*': ['.mp3', '.wav', '.flac']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: isUploading
  })

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Drop Zone */}
          {!isUploading && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium mb-2">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Support for PDF, DOCX, images, videos, audio files (Max 100MB each)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Selected Files ({files.length})</h3>
              <div className="grid gap-3">
                {files.map((file) => {
                  const progress = uploadProgress.find(p => p.fileId === file.id)
                  
                  return (
                    <Card key={file.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {file.preview ? (
                            <img 
                              src={file.preview} 
                              alt={file.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            getFileIcon(file)
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                          
                          {progress && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Progress value={progress.progress} className="flex-1" />
                                <span className="text-xs text-gray-500">
                                  {progress.progress}%
                                </span>
                                {progress.status === 'complete' && (
                                  <Check className="w-4 h-4 text-green-500" />
                                )}
                                {progress.status === 'error' && (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 capitalize">
                                {progress.status === 'uploading' && 'Uploading...'}
                                {progress.status === 'processing' && 'Processing...'}
                                {progress.status === 'complete' && 'Complete'}
                                {progress.status === 'error' && progress.error}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {!isUploading && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upload Form */}
          {files.length > 0 && !isUploading && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter document title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="folder">Folder</Label>
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No folder</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: folder.color || '#6B7280' }}
                            />
                            {folder.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter document description (optional)"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>AI Processing Options</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="extractText"
                      checked={extractText}
                      onCheckedChange={setExtractText}
                    />
                    <Label htmlFor="extractText" className="text-sm">Extract text content</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generateSummary"
                      checked={generateSummary}
                      onCheckedChange={setGenerateSummary}
                    />
                    <Label htmlFor="generateSummary" className="text-sm">Generate AI summary</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="extractKeywords"
                      checked={extractKeywords}
                      onCheckedChange={setExtractKeywords}
                    />
                    <Label htmlFor="extractKeywords" className="text-sm">Extract keywords</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="detectLanguage"
                      checked={detectLanguage}
                      onCheckedChange={setDetectLanguage}
                    />
                    <Label htmlFor="detectLanguage" className="text-sm">Detect language</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            {files.length > 0 && (
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {files.length} file{files.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}