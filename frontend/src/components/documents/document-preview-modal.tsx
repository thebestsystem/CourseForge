'use client'

import { useState } from 'react'
import { Download, X, Eye, FileText, Calendar, User, Folder, Hash, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Document, getFileTypeIcon, formatFileSize, getStatusColor, getStatusIcon, isImageFile, isPDFFile } from '@/lib/api/documents'

interface DocumentPreviewModalProps {
  document: Document
  isOpen: boolean
  onClose: () => void
  onDownload: (document: Document) => void
}

export function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
  onDownload
}: DocumentPreviewModalProps) {
  const [activeTab, setActiveTab] = useState('preview')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderPreview = () => {
    if (document.status === 'PROCESSING') {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 animate-spin border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="text-gray-600">Document is being processed...</p>
          </div>
        </div>
      )
    }

    if (document.status === 'ERROR') {
      return (
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 text-red-500 flex items-center justify-center">
              ❌
            </div>
            <p className="text-red-600 font-medium mb-2">Processing Failed</p>
            {document.processingError && (
              <p className="text-red-500 text-sm">{document.processingError}</p>
            )}
          </div>
        </div>
      )
    }

    if (isImageFile(document.mimeType) && document.fileUrl) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <img 
            src={document.fileUrl} 
            alt={document.title}
            className="w-full h-auto max-h-96 object-contain mx-auto rounded"
          />
        </div>
      )
    }

    if (isPDFFile(document.mimeType)) {
      return (
        <div className="bg-gray-50 rounded-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500 flex items-center justify-center">
              📄
            </div>
            <p className="text-gray-600 mb-4">PDF Document</p>
            <p className="text-sm text-gray-500 mb-4">
              Preview not available. Download to view the full document.
            </p>
            <Button onClick={() => onDownload(document)} disabled={document.status !== 'READY'}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      )
    }

    // Generic file preview
    return (
      <div className="bg-gray-50 rounded-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4 flex justify-center">
            {getFileTypeIcon(document.type)}
          </div>
          <p className="text-gray-600 mb-2">{document.type} File</p>
          <p className="text-sm text-gray-500 mb-4">
            {formatFileSize(document.fileSize)}
          </p>
          <Button onClick={() => onDownload(document)} disabled={document.status !== 'READY'}>
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold truncate pr-4">
                {document.title}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={`${getStatusColor(document.status)} text-xs`}>
                  {getStatusIcon(document.status)} {document.status}
                </Badge>
                <span className="text-sm text-gray-500">{document.type}</span>
                <span className="text-sm text-gray-500">{formatFileSize(document.fileSize)}</span>
                {document.language && (
                  <Badge variant="outline" className="text-xs uppercase">
                    {document.language}
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => onDownload(document)}
              disabled={document.status !== 'READY'}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="details">
              <FileText className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="content">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="metadata">
              <Hash className="w-4 h-4 mr-2" />
              Metadata
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-6">
            {renderPreview()}
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Original Name</p>
                      <p className="text-sm text-gray-900">{document.originalName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">File Size</p>
                      <p className="text-sm text-gray-900">{formatFileSize(document.fileSize)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">File Type</p>
                      <p className="text-sm text-gray-900">{document.mimeType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Category</p>
                      <p className="text-sm text-gray-900">{document.type}</p>
                    </div>
                  </div>

                  {document.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Description</p>
                      <p className="text-sm text-gray-900">{document.description}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Created</p>
                      <p className="text-sm text-gray-900">{formatDate(document.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Modified</p>
                      <p className="text-sm text-gray-900">{formatDate(document.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Downloads</p>
                      <p className="text-sm text-gray-900">{document.downloadCount}</p>
                    </div>
                    {document.lastAccessedAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Accessed</p>
                        <p className="text-sm text-gray-900">{formatDate(document.lastAccessedAt)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Organization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Folder</p>
                    {document.folder ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: document.folder.color || '#6B7280' }}
                        />
                        <span className="text-sm text-gray-900">{document.folder.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No folder assigned</span>
                    )}
                  </div>

                  {document.course && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Course</p>
                      <span className="text-sm text-gray-900">{document.course.title}</span>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Tags</p>
                    {document.tags && document.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {document.tags.map((tag) => (
                          <Badge 
                            key={tag.id} 
                            variant="outline"
                            style={{ 
                              borderColor: tag.color || '#6B7280',
                              color: tag.color || '#6B7280'
                            }}
                          >
                            #{tag.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No tags assigned</span>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Access Level</p>
                    <Badge variant={document.isPublic ? "default" : "secondary"}>
                      {document.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <div className="space-y-6">
              {/* AI Summary */}
              {document.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                      AI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-blue-900 leading-relaxed">{document.summary}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Keywords */}
              {document.keywords && document.keywords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Keywords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {document.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Extracted Text */}
              {document.extractedText && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Extracted Text</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                        {document.extractedText}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No AI content message */}
              {!document.summary && !document.keywords?.length && !document.extractedText && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No AI insights available for this document.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technical Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Document ID</p>
                      <p className="text-sm text-gray-900 font-mono">{document.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">File Path</p>
                      <p className="text-sm text-gray-900 font-mono truncate">{document.filePath}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">MIME Type</p>
                      <p className="text-sm text-gray-900">{document.mimeType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Access Level</p>
                      <p className="text-sm text-gray-900">{document.accessLevel}</p>
                    </div>
                  </div>

                  {document.language && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Detected Language</p>
                      <p className="text-sm text-gray-900">{document.language}</p>
                    </div>
                  )}

                  {document.metadata && Object.keys(document.metadata).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Additional Metadata</p>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-xs text-gray-700">
                          {JSON.stringify(document.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {document.processingError && (
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-2">Processing Error</p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-700">{document.processingError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}