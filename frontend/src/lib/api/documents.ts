import { apiClient } from '@/lib/api-client'

// Types
export interface Document {
  id: string
  title: string
  description?: string
  filename: string
  originalName: string
  filePath: string
  fileUrl?: string
  fileSize: number
  mimeType: string
  type: string
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERROR' | 'DELETED'
  ownerId: string
  courseId?: string
  folderId?: string
  extractedText?: string
  summary?: string
  keywords?: string[]
  language?: string
  metadata?: Record<string, any>
  processingError?: string
  downloadCount: number
  lastAccessedAt?: string
  isPublic: boolean
  accessLevel: string
  createdAt: string
  updatedAt: string
  course?: {
    id: string
    title: string
  }
  folder?: {
    id: string
    name: string
    color?: string
  }
  tags?: DocumentTag[]
}

export interface DocumentFolder {
  id: string
  name: string
  description?: string
  ownerId: string
  parentId?: string
  courseId?: string
  color?: string
  createdAt: string
  updatedAt: string
  _count?: {
    documents: number
    children: number
  }
}

export interface DocumentTag {
  id: string
  name: string
  color?: string
  ownerId: string
  createdAt: string
  _count?: {
    documents: number
  }
}

export interface DocumentsResponse {
  documents: Document[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UploadDocumentRequest {
  file: File
  title: string
  description?: string
  courseId?: string
  folderId?: string
  extractText?: boolean
  generateSummary?: boolean
  extractKeywords?: boolean
  detectLanguage?: boolean
}

export interface GetDocumentsParams {
  courseId?: string
  folderId?: string
  search?: string
  type?: string
  status?: 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERROR'
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'title' | 'fileSize' | 'type'
  sortOrder?: 'asc' | 'desc'
}

export interface CreateFolderRequest {
  name: string
  description?: string
  parentId?: string
  courseId?: string
  color?: string
}

export interface CreateTagRequest {
  name: string
  color?: string
}

// API Client
export const documentsApi = {
  // Get documents with filtering and pagination
  async getDocuments(params: GetDocumentsParams = {}): Promise<DocumentsResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/documents?${searchParams.toString()}`)
    return response.data.data
  },

  // Get specific document
  async getDocument(id: string): Promise<Document> {
    const response = await apiClient.get(`/documents/${id}`)
    return response.data.data
  },

  // Upload document
  async uploadDocument(request: UploadDocumentRequest): Promise<Document> {
    const formData = new FormData()
    
    formData.append('file', request.file)
    formData.append('title', request.title)
    
    if (request.description) formData.append('description', request.description)
    if (request.courseId) formData.append('courseId', request.courseId)
    if (request.folderId) formData.append('folderId', request.folderId)
    if (request.extractText !== undefined) formData.append('extractText', request.extractText.toString())
    if (request.generateSummary !== undefined) formData.append('generateSummary', request.generateSummary.toString())
    if (request.extractKeywords !== undefined) formData.append('extractKeywords', request.extractKeywords.toString())
    if (request.detectLanguage !== undefined) formData.append('detectLanguage', request.detectLanguage.toString())

    const response = await apiClient.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  // Update document
  async updateDocument(
    id: string, 
    updates: { title?: string; description?: string; folderId?: string; courseId?: string }
  ): Promise<Document> {
    const response = await apiClient.put(`/documents/${id}`, updates)
    return response.data.data
  },

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`)
  },

  // Download document
  async downloadDocument(id: string): Promise<Blob> {
    const response = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  // Get folders
  async getFolders(): Promise<DocumentFolder[]> {
    const response = await apiClient.get('/documents/folders')
    return response.data.data
  },

  // Create folder
  async createFolder(request: CreateFolderRequest): Promise<DocumentFolder> {
    const response = await apiClient.post('/documents/folders', request)
    return response.data.data
  },

  // Get tags
  async getTags(): Promise<DocumentTag[]> {
    const response = await apiClient.get('/documents/tags')
    return response.data.data
  },

  // Create tag
  async createTag(request: CreateTagRequest): Promise<DocumentTag> {
    const response = await apiClient.post('/documents/tags', request)
    return response.data.data
  },
}

// Utility functions
export const getFileTypeIcon = (type: string): string => {
  const icons = {
    PDF: '📄',
    DOCX: '📝',
    DOC: '📝',
    TXT: '📄',
    MD: '📝',
    IMAGE: '🖼️',
    JPG: '🖼️',
    JPEG: '🖼️',
    PNG: '🖼️',
    GIF: '🖼️',
    VIDEO: '🎥',
    MP4: '🎥',
    AUDIO: '🎵',
    MP3: '🎵',
    WAV: '🎵',
  }
  return icons[type.toUpperCase() as keyof typeof icons] || '📎'
}

export const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'READY': return 'text-green-600 bg-green-100'
    case 'PROCESSING': return 'text-blue-600 bg-blue-100'
    case 'UPLOADING': return 'text-yellow-600 bg-yellow-100'
    case 'ERROR': return 'text-red-600 bg-red-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'READY': return '✅'
    case 'PROCESSING': return '⏳'
    case 'UPLOADING': return '📤'
    case 'ERROR': return '❌'
    default: return '❓'
  }
}

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/')
}

export const isVideoFile = (mimeType: string): boolean => {
  return mimeType.startsWith('video/')
}

export const isAudioFile = (mimeType: string): boolean => {
  return mimeType.startsWith('audio/')
}

export const isPDFFile = (mimeType: string): boolean => {
  return mimeType === 'application/pdf'
}