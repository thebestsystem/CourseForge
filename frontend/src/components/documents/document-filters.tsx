'use client'

import { Filter, FolderOpen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DocumentFolder, GetDocumentsParams } from '@/lib/api/documents'

interface DocumentFiltersProps {
  filters: GetDocumentsParams
  onFiltersChange: (filters: Partial<GetDocumentsParams>) => void
  folders: DocumentFolder[]
  onFolderSelect: (folderId: string | null) => void
  selectedFolder: string | null
}

export function DocumentFilters({
  filters,
  onFiltersChange,
  folders,
  onFolderSelect,
  selectedFolder
}: DocumentFiltersProps) {
  const documentTypes = [
    { value: 'PDF', label: 'PDF Documents' },
    { value: 'DOCX', label: 'Word Documents' },
    { value: 'IMAGE', label: 'Images' },
    { value: 'VIDEO', label: 'Videos' },
    { value: 'AUDIO', label: 'Audio Files' },
    { value: 'TXT', label: 'Text Files' }
  ]

  const statusOptions = [
    { value: 'READY', label: 'Ready' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'UPLOADING', label: 'Uploading' },
    { value: 'ERROR', label: 'Error' }
  ]

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'title', label: 'Title' },
    { value: 'fileSize', label: 'File Size' },
    { value: 'type', label: 'File Type' }
  ]

  const hasActiveFilters = !!(
    filters.type || 
    filters.status || 
    selectedFolder ||
    (filters.sortBy && filters.sortBy !== 'createdAt') ||
    (filters.sortOrder && filters.sortOrder !== 'desc')
  )

  const clearAllFilters = () => {
    onFiltersChange({
      type: undefined,
      status: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    onFolderSelect(null)
  }

  const selectedFolderData = selectedFolder 
    ? folders.find(f => f.id === selectedFolder)
    : null

  return (
    <div className="flex items-center gap-2">
      {/* Folder Quick Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="w-4 h-4 mr-2" />
            {selectedFolderData ? selectedFolderData.name : 'All Folders'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Folder</Label>
            <div className="space-y-1">
              <button
                onClick={() => onFolderSelect(null)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  !selectedFolder 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'hover:bg-gray-100'
                }`}
              >
                All Documents
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => onFolderSelect(folder.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                    selectedFolder === folder.id 
                      ? 'bg-blue-100 text-blue-900' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: folder.color || '#6B7280' }}
                  />
                  <span className="flex-1">{folder.name}</span>
                  <span className="text-xs text-gray-500">
                    {folder._count?.documents || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Advanced Filters */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                •
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Filters</Label>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {/* File Type */}
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">File Type</Label>
                <Select 
                  value={filters.type || ''} 
                  onValueChange={(value) => onFiltersChange({ type: value || undefined })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Status</Label>
                <Select 
                  value={filters.status || ''} 
                  onValueChange={(value) => onFiltersChange({ status: value as any || undefined })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Sort Options */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Sort By</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={filters.sortBy || 'createdAt'} 
                    onValueChange={(value) => onFiltersChange({ sortBy: value as any })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={filters.sortOrder || 'desc'} 
                    onValueChange={(value) => onFiltersChange({ sortOrder: value as any })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 ml-2">
          {filters.type && (
            <Badge variant="secondary" className="text-xs">
              Type: {documentTypes.find(t => t.value === filters.type)?.label || filters.type}
              <button 
                onClick={() => onFiltersChange({ type: undefined })}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-2 h-2" />
              </button>
            </Badge>
          )}

          {filters.status && (
            <Badge variant="secondary" className="text-xs">
              Status: {statusOptions.find(s => s.value === filters.status)?.label || filters.status}
              <button 
                onClick={() => onFiltersChange({ status: undefined })}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-2 h-2" />
              </button>
            </Badge>
          )}

          {selectedFolderData && (
            <Badge variant="secondary" className="text-xs">
              Folder: {selectedFolderData.name}
              <button 
                onClick={() => onFolderSelect(null)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-2 h-2" />
              </button>
            </Badge>
          )}

          {filters.sortBy && filters.sortBy !== 'createdAt' && (
            <Badge variant="secondary" className="text-xs">
              Sort: {sortOptions.find(s => s.value === filters.sortBy)?.label}
              <button 
                onClick={() => onFiltersChange({ sortBy: 'createdAt' })}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-2 h-2" />
              </button>
            </Badge>
          )}

          {filters.sortOrder && filters.sortOrder !== 'desc' && (
            <Badge variant="secondary" className="text-xs">
              Order: Oldest First
              <button 
                onClick={() => onFiltersChange({ sortOrder: 'desc' })}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-2 h-2" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}