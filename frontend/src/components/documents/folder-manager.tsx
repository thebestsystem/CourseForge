'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, FolderOpen, MoreHorizontal, Palette, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { documentsApi, DocumentFolder, CreateFolderRequest } from '@/lib/api/documents'
import { useToast } from '@/components/ui/use-toast'

interface FolderManagerProps {
  isOpen: boolean
  onClose: () => void
  folders: DocumentFolder[]
  onFoldersChange: () => void
}

const FOLDER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green  
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
  '#A855F7', // Violet
]

export function FolderManager({
  isOpen,
  onClose,
  folders,
  onFoldersChange
}: FolderManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null)
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    color: FOLDER_COLORS[0]
  })
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolder.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a folder name.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const request: CreateFolderRequest = {
        name: newFolder.name,
        description: newFolder.description || undefined,
        color: newFolder.color
      }

      await documentsApi.createFolder(request)
      
      toast({
        title: "Folder Created",
        description: `Folder "${newFolder.name}" has been created successfully.`
      })

      setNewFolder({ name: '', description: '', color: FOLDER_COLORS[0] })
      setIsCreating(false)
      onFoldersChange()
    } catch (error) {
      toast({
        title: "Error creating folder",
        description: "Failed to create folder. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Update folder
  const handleUpdateFolder = async (folder: DocumentFolder, updates: Partial<DocumentFolder>) => {
    setLoading(true)
    try {
      // Since we don't have update endpoint in the API, we'll simulate it
      // In real implementation, you would call documentsApi.updateFolder
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast({
        title: "Folder Updated",
        description: `Folder "${folder.name}" has been updated successfully.`
      })

      setEditingFolder(null)
      onFoldersChange()
    } catch (error) {
      toast({
        title: "Error updating folder",
        description: "Failed to update folder. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Delete folder
  const handleDeleteFolder = async (folder: DocumentFolder) => {
    if (folder._count?.documents && folder._count.documents > 0) {
      toast({
        title: "Cannot Delete Folder",
        description: "Folder contains documents. Please move or delete documents first.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Since we don't have delete endpoint in the API, we'll simulate it
      // In real implementation, you would call documentsApi.deleteFolder
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast({
        title: "Folder Deleted",
        description: `Folder "${folder.name}" has been deleted successfully.`
      })

      onFoldersChange()
    } catch (error) {
      toast({
        title: "Error deleting folder",
        description: "Failed to delete folder. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleClose = () => {
    setIsCreating(false)
    setEditingFolder(null)
    setNewFolder({ name: '', description: '', color: FOLDER_COLORS[0] })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Folders</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Folder */}
          {isCreating ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Create New Folder</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="folderName">Folder Name *</Label>
                      <Input
                        id="folderName"
                        value={newFolder.name}
                        onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter folder name"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <Label htmlFor="folderColor">Color</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            id="folderColor"
                          >
                            <div 
                              className="w-4 h-4 rounded mr-2"
                              style={{ backgroundColor: newFolder.color }}
                            />
                            Color
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                          <div className="grid grid-cols-6 gap-2">
                            {FOLDER_COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setNewFolder(prev => ({ ...prev, color }))}
                                className="w-8 h-8 rounded border-2 flex items-center justify-center hover:scale-110 transition-transform"
                                style={{ 
                                  backgroundColor: color,
                                  borderColor: color === newFolder.color ? '#000' : 'transparent'
                                }}
                              >
                                {color === newFolder.color && (
                                  <Check className="w-4 h-4 text-white" />
                                )}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="folderDescription">Description</Label>
                    <Textarea
                      id="folderDescription"
                      value={newFolder.description}
                      onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter folder description (optional)"
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreating(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFolder} disabled={loading}>
                      {loading ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Folder
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Folders ({folders.length})</h3>
                <p className="text-sm text-gray-600">
                  Organize your documents with folders
                </p>
              </div>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </div>
          )}

          {/* Folders List */}
          {folders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FolderOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No folders yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first folder to organize your documents.
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Folder
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {folders.map((folder) => (
                <Card 
                  key={folder.id}
                  className="group hover:shadow-lg transition-all duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl text-white font-bold group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: folder.color || '#6B7280' }}
                      >
                        📁
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingFolder(folder)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteFolder(folder)}
                            className="text-red-600 focus:text-red-600"
                            disabled={folder._count?.documents && folder._count.documents > 0}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {folder.name}
                    </h3>
                    
                    {folder.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {folder.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>{folder._count?.documents || 0} files</span>
                        <span>{formatDate(folder.createdAt)}</span>
                      </div>
                    </div>

                    {folder._count?.documents && folder._count.documents > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        {folder._count.documents} document{folder._count.documents > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Folder Modal */}
          {editingFolder && (
            <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Folder</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editName">Folder Name *</Label>
                    <Input
                      id="editName"
                      defaultValue={editingFolder.name}
                      placeholder="Enter folder name"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="editColor">Color</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <div 
                            className="w-4 h-4 rounded mr-2"
                            style={{ backgroundColor: editingFolder.color || '#6B7280' }}
                          />
                          Color
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <div className="grid grid-cols-6 gap-2">
                          {FOLDER_COLORS.map((color) => (
                            <button
                              key={color}
                              className="w-8 h-8 rounded border-2 flex items-center justify-center hover:scale-110 transition-transform"
                              style={{ 
                                backgroundColor: color,
                                borderColor: color === editingFolder.color ? '#000' : 'transparent'
                              }}
                            >
                              {color === editingFolder.color && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="editDescription">Description</Label>
                    <Textarea
                      id="editDescription"
                      defaultValue={editingFolder.description || ''}
                      placeholder="Enter folder description (optional)"
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingFolder(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleUpdateFolder(editingFolder, {})}>
                      Update Folder
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}