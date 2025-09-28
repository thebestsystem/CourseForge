'use client'

import { useState, useEffect } from 'react'
import { Search, Upload, FolderPlus, Tag, Filter, Grid, List, Download, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { DocumentUpload } from '@/components/documents/document-upload'
import { DocumentGrid } from '@/components/documents/document-grid'
import { DocumentList } from '@/components/documents/document-list'
import { FolderManager } from '@/components/documents/folder-manager'
import { TagManager } from '@/components/documents/tag-manager'
import { DocumentFilters } from '@/components/documents/document-filters'
import { documentsApi, Document, DocumentFolder, DocumentTag, GetDocumentsParams } from '@/lib/api/documents'
import { useToast } from '@/components/ui/use-toast'

export default function DocumentsPage() {
  // State management
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [tags, setTags] = useState<DocumentTag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [filters, setFilters] = useState<GetDocumentsParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [showUpload, setShowUpload] = useState(false)
  const [showFolderManager, setShowFolderManager] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)

  const { toast } = useToast()

  // Load initial data
  useEffect(() => {
    Promise.all([
      loadDocuments(),
      loadFolders(),
      loadTags()
    ]).finally(() => setLoading(false))
  }, [filters])

  // Load documents with current filters
  const loadDocuments = async () => {
    try {
      const params = {
        ...filters,
        search: searchQuery || undefined,
        folderId: selectedFolder || undefined
      }
      const response = await documentsApi.getDocuments(params)
      setDocuments(response.documents)
      setPagination(response.pagination)
    } catch (error) {
      toast({
        title: "Error loading documents",
        description: "Failed to load documents. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Load folders
  const loadFolders = async () => {
    try {
      const response = await documentsApi.getFolders()
      setFolders(response)
    } catch (error) {
      console.error('Failed to load folders:', error)
    }
  }

  // Load tags
  const loadTags = async () => {
    try {
      const response = await documentsApi.getTags()
      setTags(response)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  // Handle folder selection
  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolder(folderId)
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  // Handle filters change
  const handleFiltersChange = (newFilters: Partial<GetDocumentsParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  // Handle document upload success
  const handleUploadSuccess = (document: Document) => {
    setDocuments(prev => [document, ...prev])
    setShowUpload(false)
    toast({
      title: "Document uploaded",
      description: `${document.title} has been uploaded successfully.`
    })
  }

  // Handle document delete
  const handleDocumentDelete = async (documentId: string) => {
    try {
      await documentsApi.deleteDocument(documentId)
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully."
      })
    } catch (error) {
      toast({
        title: "Error deleting document",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle document download
  const handleDocumentDownload = async (document: Document) => {
    try {
      const blob = await documentsApi.downloadDocument(document.id)
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = document.originalName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download document. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const selectedFolderData = selectedFolder 
    ? folders.find(f => f.id === selectedFolder)
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Manager</h1>
          <p className="text-gray-600 mt-1">
            Upload, organize, and manage your course materials
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => setShowTagManager(true)}
            variant="outline"
          >
            <Tag className="w-4 h-4 mr-2" />
            Tags
          </Button>
          <Button 
            onClick={() => setShowFolderManager(true)}
            variant="outline"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Folders
          </Button>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <div className="text-blue-600">📄</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Folders</p>
                <p className="text-2xl font-bold text-gray-900">{folders.length}</p>
              </div>
              <div className="text-yellow-600">📁</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tags</p>
                <p className="text-2xl font-bold text-gray-900">{tags.length}</p>
              </div>
              <div className="text-green-600">🏷️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(d => d.status === 'PROCESSING').length}
                </p>
              </div>
              <div className="text-orange-600">⏳</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Folder */}
      {selectedFolderData && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: selectedFolderData.color || '#6B7280' }}
                >
                  📁
                </div>
                <div>
                  <h3 className="font-semibold">{selectedFolderData.name}</h3>
                  {selectedFolderData.description && (
                    <p className="text-sm text-gray-600">{selectedFolderData.description}</p>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => handleFolderSelect(null)}
                className="text-sm"
              >
                Back to All Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <DocumentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            folders={folders}
            onFolderSelect={handleFolderSelect}
            selectedFolder={selectedFolder}
          />

          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List className="w-4 h-4" />
            ) : (
              <Grid className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Documents Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
        <TabsContent value="grid" className="mt-0">
          <DocumentGrid
            documents={documents}
            folders={folders}
            onFolderSelect={handleFolderSelect}
            onDocumentDelete={handleDocumentDelete}
            onDocumentDownload={handleDocumentDownload}
          />
        </TabsContent>
        
        <TabsContent value="list" className="mt-0">
          <DocumentList
            documents={documents}
            folders={folders}
            onFolderSelect={handleFolderSelect}
            onDocumentDelete={handleDocumentDelete}
            onDocumentDownload={handleDocumentDownload}
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + Math.max(1, pagination.page - 2)
              return (
                <Button
                  key={page}
                  variant={page === pagination.page ? "default" : "outline"}
                  onClick={() => handlePageChange(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <DocumentUpload
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
          folders={folders}
        />
      )}

      {showFolderManager && (
        <FolderManager
          isOpen={showFolderManager}
          onClose={() => setShowFolderManager(false)}
          folders={folders}
          onFoldersChange={loadFolders}
        />
      )}

      {showTagManager && (
        <TagManager
          isOpen={showTagManager}
          onClose={() => setShowTagManager(false)}
          tags={tags}
          onTagsChange={loadTags}
        />
      )}
    </div>
  )
}