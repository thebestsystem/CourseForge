'use client'

import { useState } from 'react'
import { MoreHorizontal, Download, Eye, Edit2, Trash2, FolderOpen, Clock, FileText, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Document, DocumentFolder, getFileTypeIcon, formatFileSize, getStatusColor, getStatusIcon } from '@/lib/api/documents'
import { DocumentPreviewModal } from './document-preview-modal'

interface DocumentGridProps {
  documents: Document[]
  folders: DocumentFolder[]
  onFolderSelect: (folderId: string | null) => void
  onDocumentDelete: (documentId: string) => void
  onDocumentDownload: (document: Document) => void
}

export function DocumentGrid({
  documents,
  folders,
  onFolderSelect,
  onDocumentDelete,
  onDocumentDownload
}: DocumentGridProps) {
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)

  // Group folders and documents
  const foldersInView = folders.filter(folder => !folder.parentId) // Only root folders for now
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getThumbnailUrl = (document: Document) => {
    if (document.type === 'IMAGE') {
      return document.fileUrl || '/api/documents/' + document.id + '/thumbnail'
    }
    return null
  }

  const renderFolderCard = (folder: DocumentFolder) => (
    <Card 
      key={folder.id}
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
      onClick={() => onFolderSelect(folder.id)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div 
            className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl text-white font-bold mb-4 group-hover:scale-110 transition-transform"
            style={{ backgroundColor: folder.color || '#6B7280' }}
          >
            📁
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {folder.name}
          </h3>
          
          {folder.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {folder.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-gray-400 w-full">
            <span>{folder._count?.documents || 0} files</span>
            <span>{formatDate(folder.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderDocumentCard = (document: Document) => {
    const thumbnailUrl = getThumbnailUrl(document)
    
    return (
      <Card 
        key={document.id}
        className="group hover:shadow-lg transition-all duration-200"
      >
        <CardContent className="p-0">
          {/* Document Preview/Thumbnail */}
          <div className="relative h-48 bg-gray-50 rounded-t-lg overflow-hidden">
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={document.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="text-6xl opacity-60">
                  {getFileTypeIcon(document.type)}
                </div>
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className={`${getStatusColor(document.status)} text-xs`}>
                      {getStatusIcon(document.status)} {document.status}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {document.status === 'PROCESSING' && 'Document is being processed'}
                    {document.status === 'READY' && 'Document is ready for use'}
                    {document.status === 'ERROR' && 'Processing failed'}
                    {document.status === 'UPLOADING' && 'Upload in progress'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Processing Error */}
            {document.status === 'ERROR' && document.processingError && (
              <div className="absolute top-3 right-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      {document.processingError}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {/* Actions Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviewDocument(document)
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDocumentDownload(document)
                  }}
                  disabled={document.status !== 'READY'}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Document Info */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                {document.title}
              </h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setPreviewDocument(document)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDocumentDownload(document)}
                    disabled={document.status !== 'READY'}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {document.folder && (
                    <DropdownMenuItem onClick={() => onFolderSelect(document.folder!.id)}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Go to Folder
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDocumentDelete(document.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {document.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {document.description}
              </p>
            )}

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {document.tags.slice(0, 3).map((tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      borderColor: tag.color || '#6B7280',
                      color: tag.color || '#6B7280'
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {document.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    +{document.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* AI Insights */}
            {document.summary && (
              <div className="bg-blue-50 rounded-md p-3 mb-3">
                <p className="text-xs font-medium text-blue-900 mb-1">AI Summary</p>
                <p className="text-xs text-blue-700 line-clamp-2">
                  {document.summary}
                </p>
              </div>
            )}

            {/* Keywords */}
            {document.keywords && document.keywords.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {document.keywords.slice(0, 5).map((keyword, index) => (
                    <span 
                      key={index}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                  {document.keywords.length > 5 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                      +{document.keywords.length - 5}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Footer Info */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
              <div className="flex items-center gap-2">
                <span>{formatFileSize(document.fileSize)}</span>
                {document.language && (
                  <>
                    <span>•</span>
                    <span className="uppercase">{document.language}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(document.createdAt)}</span>
              </div>
            </div>

            {/* Download Count */}
            {document.downloadCount > 0 && (
              <div className="flex items-center justify-end text-xs text-gray-400 mt-2">
                <Download className="w-3 h-3 mr-1" />
                <span>{document.downloadCount} downloads</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (documents.length === 0 && foldersInView.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
        <p className="text-gray-500 mb-4">
          Get started by uploading your first document or create a folder to organize your files.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Folders Grid */}
      {foldersInView.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Folders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {foldersInView.map(renderFolderCard)}
          </div>
        </div>
      )}

      {/* Documents Grid */}
      {documents.length > 0 && (
        <div>
          {foldersInView.length > 0 && (
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {documents.map(renderDocumentCard)}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
          onDownload={onDocumentDownload}
        />
      )}
    </div>
  )
}