'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Eye, 
  RefreshCw, 
  Search, 
  Filter,
  Copy,
  Download,
  Clock,
  DollarSign,
  Zap,
  ExternalLink,
  Calendar,
  User
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { 
  type AIAgentExecution, 
  formatDuration, 
  formatCost, 
  getStatusColor, 
  getStatusIcon,
  getAgentIcon,
  aiAgentsApi
} from '@/lib/api/ai-agents'
import { format } from 'date-fns'

interface ExecutionHistoryTableProps {
  executions: AIAgentExecution[]
  onRefresh: () => void
}

interface ExecutionDetailsDialogProps {
  execution: AIAgentExecution | null
  open: boolean
  onClose: () => void
}

function ExecutionDetailsDialog({ execution, open, onClose }: ExecutionDetailsDialogProps) {
  const { toast } = useToast()

  if (!execution) return null

  const handleCopyContent = () => {
    if (execution.output?.content) {
      navigator.clipboard.writeText(execution.output.content)
      toast({
        title: 'Copied',
        description: 'Content copied to clipboard',
      })
    }
  }

  const handleDownloadContent = () => {
    if (execution.output?.content) {
      const blob = new Blob([execution.output.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `execution-${execution.id}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getAgentIcon(execution.agentType)}</span>
            Execution Details
          </DialogTitle>
          <DialogDescription>
            {execution.agent?.name || execution.agentType} execution from{' '}
            {format(new Date(execution.startedAt), 'MMM dd, yyyy at HH:mm')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStatusIcon(execution.status)}</span>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className={`text-sm ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {execution.duration && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(execution.duration)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {execution.output?.usage && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Tokens</p>
                      <p className="text-sm text-muted-foreground">
                        {execution.output.usage.totalTokens}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {execution.cost && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Cost</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCost(execution.cost)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>The original prompt and context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Prompt</Label>
                <div className="p-3 bg-muted rounded-lg mt-2">
                  <pre className="whitespace-pre-wrap text-sm">{execution.input.prompt}</pre>
                </div>
              </div>

              {execution.input.context && Object.keys(execution.input.context).length > 0 && (
                <div>
                  <Label>Context</Label>
                  <div className="p-3 bg-muted rounded-lg mt-2 font-mono text-sm">
                    <pre>{JSON.stringify(execution.input.context, null, 2)}</pre>
                  </div>
                </div>
              )}

              {execution.courseId && execution.course && (
                <div>
                  <Label>Associated Course</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{execution.course.title}</Badge>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output */}
          {execution.output?.content && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Generated Content
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyContent}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadContent}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{execution.output.content}</pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          {execution.output?.usage && (
            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Token Usage</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Prompt tokens:</span>
                        <span>{execution.output.usage.promptTokens}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Completion tokens:</span>
                        <span>{execution.output.usage.completionTokens}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total tokens:</span>
                        <span>{execution.output.usage.totalTokens}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Timing</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Started:</span>
                        <span>{format(new Date(execution.startedAt), 'HH:mm:ss')}</span>
                      </div>
                      {execution.completedAt && (
                        <div className="flex justify-between text-sm">
                          <span>Completed:</span>
                          <span>{format(new Date(execution.completedAt), 'HH:mm:ss')}</span>
                        </div>
                      )}
                      {execution.duration && (
                        <>
                          <Separator />
                          <div className="flex justify-between text-sm font-medium">
                            <span>Duration:</span>
                            <span>{formatDuration(execution.duration)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {execution.output?.metadata && Object.keys(execution.output.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm p-3 bg-muted rounded-lg">
                  <pre>{JSON.stringify(execution.output.metadata, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ExecutionHistoryTable({ executions, onRefresh }: ExecutionHistoryTableProps) {
  const [selectedExecution, setSelectedExecution] = useState<AIAgentExecution | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [agentFilter, setAgentFilter] = useState<string>('all')

  const filteredExecutions = executions.filter(execution => {
    const matchesSearch = execution.input.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         execution.agent?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter
    const matchesAgent = agentFilter === 'all' || execution.agentType === agentFilter
    
    return matchesSearch && matchesStatus && matchesAgent
  })

  const uniqueAgentTypes = Array.from(new Set(executions.map(e => e.agentType)))

  const handleViewDetails = (execution: AIAgentExecution) => {
    setSelectedExecution(execution)
    setDetailsOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search executions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="RUNNING">Running</SelectItem>
          </SelectContent>
        </Select>

        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {uniqueAgentTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={onRefresh} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Prompt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExecutions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {executions.length === 0 
                    ? 'No executions found' 
                    : 'No executions match your filters'}
                </TableCell>
              </TableRow>
            ) : (
              filteredExecutions.map((execution) => (
                <TableRow key={execution.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getAgentIcon(execution.agentType)}</span>
                      <div>
                        <p className="font-medium text-sm">
                          {execution.agent?.name || execution.agentType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {execution.agentType}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-[200px]">
                    <p className="text-sm truncate" title={execution.input.prompt}>
                      {execution.input.prompt}
                    </p>
                    {execution.course && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {execution.course.title}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{getStatusIcon(execution.status)}</span>
                      <span className={`text-sm ${getStatusColor(execution.status)}`}>
                        {execution.status}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">
                    {execution.duration ? formatDuration(execution.duration) : '-'}
                  </TableCell>

                  <TableCell className="text-sm">
                    {execution.cost ? formatCost(execution.cost) : '-'}
                  </TableCell>

                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(execution.startedAt), 'MMM dd, HH:mm')}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(execution)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <ExecutionDetailsDialog
        execution={selectedExecution}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  )
}