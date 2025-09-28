'use client'

import { useState } from 'react'
import { MoreHorizontal, Download, Eye, Edit2, Trash2, FolderOpen, Clock, FileText, ArrowUpDown, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import { Document, DocumentFolder, getFileTypeIcon, formatFileSize, getStatusColor, getStatusIcon } from '@/lib/api/documents'
import { DocumentPreviewModal } from './document-preview-modal'

interface DocumentListProps {
  documents: Document[]
  folders: DocumentFolder[]
  onFolderSelect: (folderId: string | null) => void
  onDocumentDelete: (documentId: string) => void
  onDocumentDownload: (document: Document) => void
}

export function DocumentList({
  documents,
  folders,
  onFolderSelect,
  onDocumentDelete,
  onDocumentDownload
}: DocumentListProps) {
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<'title' | 'createdAt' | 'fileSize' | 'type'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedDocuments = [...documents].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'createdAt':
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
        break
      case 'fileSize':
        aValue = a.fileSize
        bValue = b.fileSize
        break
      case 'type':
        aValue = a.type
        bValue = b.type
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(new Set(documents.map(doc => doc.id)))
    } else {
      setSelectedDocuments(new Set())
    }
  }

  const handleSelectDocument = (documentId: string, checked: boolean) => {
    const newSelected = new Set(selectedDocuments)
    if (checked) {
      newSelected.add(documentId)
    } else {
      newSelected.delete(documentId)
    }
    setSelectedDocuments(newSelected)
  }

  const isAllSelected = documents.length > 0 && selectedDocuments.size === documents.length
  const isIndeterminate = selectedDocuments.size > 0 && selectedDocuments.size < documents.length

  if (documents.length === 0) {
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
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedDocuments.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedDocuments.size} document{selectedDocuments.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Selected
              </Button>
              <Button size="sm" variant="outline">
                <Edit2 className="w-4 h-4 mr-2" />
                Move to Folder
              </Button>
              <Button size="sm" variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className={isIndeterminate ? 'data-[state=checked]:bg-blue-600' : ''}
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2">
                  Name
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-2">
                  Type
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Folder</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('fileSize')}
              >
                <div className="flex items-center gap-2">
                  Size
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-2">
                  Created
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                </div>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDocuments.map((document) => (
              <TableRow 
                key={document.id}
                className="hover:bg-gray-50 transition-colors group"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedDocuments.has(document.id)}
                    onCheckedChange={(checked) => handleSelectDocument(document.id, !!checked)}
                  />
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getFileTypeIcon(document.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div 
                        className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
                        onClick={() => setPreviewDocument(document)}
                      >
                        {document.title}
                      </div>
                      {document.description && (
                        <div className="text-sm text-gray-500 truncate">
                          {document.description}
                        </div>
                      )}
                      {document.extractedText && (
                        <div className="text-xs text-gray-400 truncate mt-1">
                          {document.extractedText.substring(0, 100)}...
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{document.type}</span>
                    {document.language && (
                      <Badge variant="outline" className="text-xs uppercase">
                        {document.language}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(document.status)} text-xs`}>
                      {getStatusIcon(document.status)} {document.status}
                    </Badge>
                    {document.status === 'ERROR' && document.processingError && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {document.processingError}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {document.folder ? (
                    <button 
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => onFolderSelect(document.folder!.id)}
                    >
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: document.folder.color || '#6B7280' }}
                      />
                      {document.folder.name}
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>
                
                <TableCell>
                  {document.tags && document.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {document.tags.slice(0, 2).map((tag) => (
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
                      {document.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          +{document.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {formatFileSize(document.fileSize)}
                  </span>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {formatDate(document.createdAt)}
                  </div>
                  {document.downloadCount > 0 && (
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Download className="w-3 h-3 mr-1" />
                      {document.downloadCount}
                    </div>
                  )}
                </TableCell>
                
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* AI Insights for Selected Documents */}
      {selectedDocuments.size === 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          {(() => {
            const selectedDoc = documents.find(d => selectedDocuments.has(d.id))
            if (!selectedDoc) return null
            
            return (
              <div>
                <h4 className="font-medium text-blue-900 mb-3">AI Insights</h4>
                <div className="space-y-3">
                  {selectedDoc.summary && (
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">Summary</p>
                      <p className="text-sm text-blue-700">{selectedDoc.summary}</p>
                    </div>
                  )}
                  {selectedDoc.keywords && selectedDoc.keywords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedDoc.keywords.map((keyword, index) => (
                          <span 
                            key={index}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
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