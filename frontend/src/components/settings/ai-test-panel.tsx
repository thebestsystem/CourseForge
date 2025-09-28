'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { apiClient, API_ENDPOINTS } from '@/services/api'
import { 
  Bot, 
  Zap, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  DollarSign
} from 'lucide-react'

interface AIAgent {
  type: string
  name: string
  description: string
  capabilities: string[]
}

interface AIExecutionResult {
  success: boolean
  data?: {
    executionId: string
    content: string
    usage: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
    cost?: number
    duration?: number
  }
  message?: string
  error?: string
}

export function AITestPanel() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIExecutionResult | null>(null)
  const { toast } = useToast()

  // Load AI agents
  const loadAgents = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AI_AGENTS.BASE)
      setAgents(response)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load AI agents.',
        variant: 'destructive',
      })
    }
  }

  // Execute AI agent
  const executeAgent = async () => {
    if (!selectedAgent || !prompt.trim()) {
      toast({
        title: 'Error', 
        description: 'Please select an agent and enter a prompt.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      setResult(null)

      const response = await apiClient.post<AIExecutionResult>(API_ENDPOINTS.AI_AGENTS.EXECUTE, {
        agentType: selectedAgent,
        prompt: prompt.trim(),
        provider: selectedProvider || undefined
      })

      setResult(response)
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'AI agent executed successfully!',
        })
      }
    } catch (error: any) {
      const errorResult: AIExecutionResult = {
        success: false,
        error: error.response?.data?.message || error.message || 'Execution failed'
      }
      setResult(errorResult)
      
      toast({
        title: 'Execution Failed',
        description: errorResult.error,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const agentOptions = [
    { value: 'ARCHITECT', name: 'Course Architect', description: 'Structure and organize course content' },
    { value: 'RESEARCH', name: 'Research Assistant', description: 'Gather and verify information' },
    { value: 'WRITING', name: 'Content Writer', description: 'Create engaging written content' },
    { value: 'EDITING', name: 'Content Editor', description: 'Review and improve content' },
    { value: 'DESIGN', name: 'Design Specialist', description: 'Visual and UX recommendations' },
    { value: 'QUALITY', name: 'Quality Assurance', description: 'Ensure standards and accuracy' },
    { value: 'MARKETING', name: 'Marketing Expert', description: 'Create promotional content' },
  ]

  const providerOptions = [
    { value: 'openai', name: 'OpenAI GPT' },
    { value: 'deepseek', name: 'DeepSeek Chat' },
    { value: 'claude', name: 'Anthropic Claude' },
    { value: 'gemini', name: 'Google Gemini' },
    { value: 'groq', name: 'Groq (Fast)' },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>AI Agent Testing Panel</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="agent">AI Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Select an AI agent" />
              </SelectTrigger>
              <SelectContent>
                {agentOptions.map((agent) => (
                  <SelectItem key={agent.value} value={agent.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{agent.name}</span>
                      <span className="text-xs text-muted-foreground">{agent.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="provider">LLM Provider (Optional)</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Use default provider" />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt for the AI agent..."
            rows={4}
          />
        </div>

        <Button 
          onClick={executeAgent} 
          disabled={loading || !selectedAgent || !prompt.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <LoadingSpinner className="w-4 h-4 mr-2" />
              Executing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Execute AI Agent
            </>
          )}
        </Button>

        {result && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {result.success ? 'Execution Successful' : 'Execution Failed'}
                </span>
              </div>

              {result.success && result.data && (
                <>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{result.data.duration ? `${result.data.duration}ms` : 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bot className="w-4 h-4" />
                      <span>{result.data.usage.totalTokens} tokens</span>
                    </div>
                    {result.data.cost && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${result.data.cost.toFixed(4)}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium mb-2">AI Response:</h4>
                    <p className="text-sm whitespace-pre-wrap">{result.data.content}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <Badge variant="outline">
                      Input: {result.data.usage.promptTokens} tokens
                    </Badge>
                    <Badge variant="outline">
                      Output: {result.data.usage.completionTokens} tokens
                    </Badge>
                    <Badge variant="outline">
                      ID: {result.data.executionId.slice(-8)}
                    </Badge>
                  </div>
                </>
              )}

              {!result.success && result.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}