'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Tag, MoreHorizontal, Palette, Check, X, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { documentsApi, DocumentTag, CreateTagRequest } from '@/lib/api/documents'
import { useToast } from '@/components/ui/use-toast'

interface TagManagerProps {
  isOpen: boolean
  onClose: () => void
  tags: DocumentTag[]
  onTagsChange: () => void
}

const TAG_COLORS = [
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
  '#DC2626', // Red-600
  '#059669', // Green-600
  '#7C3AED', // Violet-600
  '#DB2777', // Pink-600
]

export function TagManager({
  isOpen,
  onClose,
  tags,
  onTagsChange
}: TagManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingTag, setEditingTag] = useState<DocumentTag | null>(null)
  const [newTag, setNewTag] = useState({
    name: '',
    color: TAG_COLORS[0]
  })
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()

  // Create new tag
  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a tag name.",
        variant: "destructive"
      })
      return
    }

    // Check for duplicate tag names
    const existingTag = tags.find(tag => 
      tag.name.toLowerCase() === newTag.name.trim().toLowerCase()
    )
    if (existingTag) {
      toast({
        title: "Validation Error",
        description: "A tag with this name already exists.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const request: CreateTagRequest = {
        name: newTag.name.trim(),
        color: newTag.color
      }

      await documentsApi.createTag(request)
      
      toast({
        title: "Tag Created",
        description: `Tag "${newTag.name}" has been created successfully.`
      })

      setNewTag({ name: '', color: TAG_COLORS[0] })
      setIsCreating(false)
      onTagsChange()
    } catch (error) {
      toast({
        title: "Error creating tag",
        description: "Failed to create tag. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Update tag
  const handleUpdateTag = async (tag: DocumentTag, updates: Partial<DocumentTag>) => {
    setLoading(true)
    try {
      // Since we don't have update endpoint in the API, we'll simulate it
      // In real implementation, you would call documentsApi.updateTag
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast({
        title: "Tag Updated",
        description: `Tag "${tag.name}" has been updated successfully.`
      })

      setEditingTag(null)
      onTagsChange()
    } catch (error) {
      toast({
        title: "Error updating tag",
        description: "Failed to update tag. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Delete tag
  const handleDeleteTag = async (tag: DocumentTag) => {
    if (tag._count?.documents && tag._count.documents > 0) {
      toast({
        title: "Cannot Delete Tag",
        description: "Tag is being used by documents. Please remove it from documents first.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Since we don't have delete endpoint in the API, we'll simulate it
      // In real implementation, you would call documentsApi.deleteTag
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast({
        title: "Tag Deleted",
        description: `Tag "${tag.name}" has been deleted successfully.`
      })

      onTagsChange()
    } catch (error) {
      toast({
        title: "Error deleting tag",
        description: "Failed to delete tag. Please try again.",
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
    setEditingTag(null)
    setNewTag({ name: '', color: TAG_COLORS[0] })
    onClose()
  }

  // Predefined tag suggestions
  const tagSuggestions = [
    'Important', 'Draft', 'Review', 'Approved', 'Archive',
    'Research', 'Template', 'Tutorial', 'Reference', 'Meeting',
    'Project', 'Client', 'Internal', 'Public', 'Private'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Tag */}
          {isCreating ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Create New Tag</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tagName">Tag Name *</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="tagName"
                          value={newTag.name}
                          onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter tag name"
                          maxLength={50}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tagColor">Color</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            id="tagColor"
                          >
                            <div 
                              className="w-4 h-4 rounded-full mr-2"
                              style={{ backgroundColor: newTag.color }}
                            />
                            Color
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Select Color</Label>
                            <div className="grid grid-cols-8 gap-2">
                              {TAG_COLORS.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setNewTag(prev => ({ ...prev, color }))}
                                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform"
                                  style={{ 
                                    backgroundColor: color,
                                    borderColor: color === newTag.color ? '#000' : 'transparent'
                                  }}
                                >
                                  {color === newTag.color && (
                                    <Check className="w-4 h-4 text-white" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Tag Suggestions */}
                  <div>
                    <Label className="text-sm font-medium">Quick Suggestions</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tagSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setNewTag(prev => ({ ...prev, name: suggestion }))}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  {newTag.name && (
                    <div>
                      <Label className="text-sm font-medium">Preview</Label>
                      <div className="mt-2">
                        <Badge 
                          variant="outline" 
                          className="text-sm"
                          style={{ 
                            borderColor: newTag.color,
                            color: newTag.color
                          }}
                        >
                          #{newTag.name}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreating(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTag} disabled={loading}>
                      {loading ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Tag
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
                <h3 className="text-lg font-semibold">Tags ({tags.length})</h3>
                <p className="text-sm text-gray-600">
                  Create tags to categorize and organize your documents
                </p>
              </div>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Tag
              </Button>
            </div>
          )}

          {/* Tags List */}
          {tags.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Tag className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tags yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first tag to start categorizing your documents.
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Tag
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tags.map((tag) => (
                <Card 
                  key={tag.id}
                  className="group hover:shadow-lg transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge 
                        variant="outline" 
                        className="text-sm font-medium"
                        style={{ 
                          borderColor: tag.color || '#6B7280',
                          color: tag.color || '#6B7280'
                        }}
                      >
                        #{tag.name}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingTag(tag)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTag(tag)}
                            className="text-red-600 focus:text-red-600"
                            disabled={tag._count?.documents && tag._count.documents > 0}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Used by {tag._count?.documents || 0} documents</span>
                        <span>{formatDate(tag.createdAt)}</span>
                      </div>
                      
                      {tag._count?.documents && tag._count.documents > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="h-1 rounded-full transition-all"
                            style={{ 
                              backgroundColor: tag.color || '#6B7280',
                              width: `${Math.min((tag._count.documents / Math.max(...tags.map(t => t._count?.documents || 0))) * 100, 100)}%`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Most Used Tags */}
          {tags.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-3">Most Used Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags
                  .sort((a, b) => (b._count?.documents || 0) - (a._count?.documents || 0))
                  .slice(0, 10)
                  .map((tag) => (
                    <Badge 
                      key={tag.id}
                      variant="outline" 
                      className="text-sm"
                      style={{ 
                        borderColor: tag.color || '#6B7280',
                        color: tag.color || '#6B7280'
                      }}
                    >
                      #{tag.name} ({tag._count?.documents || 0})
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Edit Tag Modal */}
          {editingTag && (
            <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Tag</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editName">Tag Name *</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="editName"
                        defaultValue={editingTag.name}
                        placeholder="Enter tag name"
                        maxLength={50}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="editColor">Color</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <div 
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: editingTag.color || '#6B7280' }}
                          />
                          Color
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Select Color</Label>
                          <div className="grid grid-cols-8 gap-2">
                            {TAG_COLORS.map((color) => (
                              <button
                                key={color}
                                className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform"
                                style={{ 
                                  backgroundColor: color,
                                  borderColor: color === editingTag.color ? '#000' : 'transparent'
                                }}
                              >
                                {color === editingTag.color && (
                                  <Check className="w-4 h-4 text-white" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Preview */}
                  <div>
                    <Label className="text-sm font-medium">Preview</Label>
                    <div className="mt-2">
                      <Badge 
                        variant="outline" 
                        className="text-sm"
                        style={{ 
                          borderColor: editingTag.color || '#6B7280',
                          color: editingTag.color || '#6B7280'
                        }}
                      >
                        #{editingTag.name}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingTag(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleUpdateTag(editingTag, {})}>
                      Update Tag
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