'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  StopCircle, 
  Copy, 
  Download, 
  RefreshCw,
  Settings,
  Info,
  Clock,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { aiAgentsApi, type AIAgent, type ExecutionRequest, type ExecutionResult } from '@/lib/api/ai-agents'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'

interface AIAgentExecutionDialogProps {
  agent: AIAgent
  open: boolean
  onClose: () => void
  onSuccess: (result: ExecutionResult) => void
  onError: (error: string) => void
}

interface ExecutionState {
  isExecuting: boolean
  result: ExecutionResult | null
  error: string | null
  progress: number
}

export function AIAgentExecutionDialog({
  agent,
  open,
  onClose,
  onSuccess,
  onError
}: AIAgentExecutionDialogProps) {
  const [prompt, setPrompt] = useState('')
  const [context, setContext] = useState('')
  const [courseId, setCourseId] = useState('')
  const [execution, setExecution] = useState<ExecutionState>({
    isExecuting: false,
    result: null,
    error: null,
    progress: 0
  })
  const [modelConfig, setModelConfig] = useState({
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    model: agent.model
  })
  const [activeTab, setActiveTab] = useState('input')
  const { toast } = useToast()

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPrompt('')
      setContext('')
      setCourseId('')
      setExecution({
        isExecuting: false,
        result: null,
        error: null,
        progress: 0
      })
      setModelConfig({
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        model: agent.model
      })
      setActiveTab('input')
    }
  }, [open, agent])

  const handleExecute = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive',
      })
      return
    }

    setExecution(prev => ({ ...prev, isExecuting: true, error: null, progress: 10 }))
    setActiveTab('output')

    try {
      const request: ExecutionRequest = {
        agentType: agent.type,
        prompt: prompt.trim(),
        context: context.trim() ? JSON.parse(context) : undefined,
        courseId: courseId.trim() || undefined,
        modelConfig: {
          temperature: modelConfig.temperature,
          maxTokens: modelConfig.maxTokens,
        }
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExecution(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }))
      }, 500)

      const result = await aiAgentsApi.executeAgent(request)
      
      clearInterval(progressInterval)
      setExecution({
        isExecuting: false,
        result,
        error: null,
        progress: 100
      })

      onSuccess(result)
    } catch (error: any) {
      setExecution(prev => ({
        ...prev,
        isExecuting: false,
        error: error.response?.data?.message || error.message || 'Execution failed',
        progress: 0
      }))
      onError(error.response?.data?.message || error.message || 'Execution failed')
    }
  }

  const handleCopyResult = () => {
    if (execution.result?.content) {
      navigator.clipboard.writeText(execution.result.content)
      toast({
        title: 'Copied',
        description: 'Result copied to clipboard',
      })
    }
  }

  const handleDownloadResult = () => {
    if (execution.result?.content) {
      const blob = new Blob([execution.result.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${agent.name.toLowerCase().replace(/\s+/g, '-')}-result.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleReset = () => {
    setExecution({
      isExecuting: false,
      result: null,
      error: null,
      progress: 0
    })
    setActiveTab('input')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              {agent.type === 'ARCHITECT' && <span>🏗️</span>}
              {agent.type === 'RESEARCH' && <span>🔍</span>}
              {agent.type === 'WRITING' && <span>✍️</span>}
              {agent.type === 'EDITING' && <span>✏️</span>}
              {agent.type === 'DESIGN' && <span>🎨</span>}
              {agent.type === 'QUALITY' && <span>🛡️</span>}
              {agent.type === 'MARKETING' && <span>📈</span>}
            </div>
            Execute {agent.name}
          </DialogTitle>
          <DialogDescription>
            {agent.description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          {/* Input Tab */}
          <TabsContent value="input" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea
                  id="prompt"
                  placeholder={`Enter your request for the ${agent.name}...`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px]"
                  disabled={execution.isExecuting}
                />
                <p className="text-sm text-muted-foreground">
                  Describe what you want the {agent.name} to help you with. Be specific and clear.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="context">Context (Optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Additional context as JSON (optional)..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="min-h-[80px] font-mono text-sm"
                  disabled={execution.isExecuting}
                />
                <p className="text-sm text-muted-foreground">
                  Provide additional context in JSON format if needed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="courseId">Course ID (Optional)</Label>
                <Input
                  id="courseId"
                  placeholder="Associate with a specific course..."
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  disabled={execution.isExecuting}
                />
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose} disabled={execution.isExecuting}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleExecute} 
                  disabled={execution.isExecuting || !prompt.trim()}
                  className="min-w-[120px]"
                >
                  {execution.isExecuting ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Execute
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Output Tab */}
          <TabsContent value="output" className="space-y-4">
            {execution.isExecuting && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Processing...
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={execution.progress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2">
                    The {agent.name} is working on your request...
                  </p>
                </CardContent>
              </Card>
            )}

            {execution.error && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Execution Failed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-destructive">{execution.error}</p>
                  <Button variant="outline" onClick={handleReset} className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {execution.result && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Execution Completed
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopyResult}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadResult}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Result Content */}
                      <div className="space-y-2">
                        <Label>Generated Content</Label>
                        <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm">{execution.result.content}</pre>
                        </div>
                      </div>

                      {/* Execution Metrics */}
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{(execution.result.duration / 1000).toFixed(1)}s</p>
                            <p className="text-xs text-muted-foreground">Duration</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{execution.result.usage.totalTokens}</p>
                            <p className="text-xs text-muted-foreground">Tokens</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">${execution.result.cost.toFixed(4)}</p>
                            <p className="text-xs text-muted-foreground">Cost</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleReset}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    New Execution
                  </Button>
                  <Button onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            )}

            {!execution.isExecuting && !execution.result && !execution.error && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Click "Execute" in the Input tab to run the {agent.name}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Model Configuration
                </CardTitle>
                <CardDescription>
                  Adjust the AI model parameters for this execution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={modelConfig.model}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, model: e.target.value }))}
                    disabled={execution.isExecuting}
                  />
                  <p className="text-sm text-muted-foreground">
                    AI model to use for this execution
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature: {modelConfig.temperature}</Label>
                  <Input
                    id="temperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={modelConfig.temperature}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    disabled={execution.isExecuting}
                  />
                  <p className="text-sm text-muted-foreground">
                    Higher values make output more random, lower values more focused
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="4000"
                    value={modelConfig.maxTokens}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    disabled={execution.isExecuting}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of tokens to generate
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Agent Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Capabilities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {agent.capabilities.map((capability, index) => (
                      <Badge key={index} variant="outline">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Default Settings</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2 p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{agent.model}</p>
                      <p className="text-xs text-muted-foreground">Model</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{agent.temperature}</p>
                      <p className="text-xs text-muted-foreground">Temperature</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{agent.maxTokens}</p>
                      <p className="text-xs text-muted-foreground">Max Tokens</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}