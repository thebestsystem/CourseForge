import { apiClient } from '@/lib/api-client'

// Types
export interface AIAgent {
  id: string
  type: 'ARCHITECT' | 'RESEARCH' | 'WRITING' | 'EDITING' | 'DESIGN' | 'QUALITY' | 'MARKETING'
  name: string
  description: string
  capabilities: string[]
  model: string
  temperature: number
  maxTokens: number
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface AIAgentExecution {
  id: string
  agentType: string
  courseId?: string
  input: {
    prompt: string
    context?: Record<string, any>
    modelConfig?: any
  }
  output?: {
    content: string
    usage: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
    metadata?: Record<string, any>
  }
  status: 'RUNNING' | 'COMPLETED' | 'FAILED'
  startedAt: string
  completedAt?: string
  duration?: number
  cost?: number
  agent?: {
    name: string
    description: string
  }
  course?: {
    title: string
  }
}

export interface ExecutionRequest {
  agentType: string
  prompt: string
  context?: Record<string, any>
  courseId?: string
  modelConfig?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
}

export interface ExecutionResult {
  executionId: string
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost: number
  duration: number
  metadata?: Record<string, any>
}

export interface ExecutionHistoryParams {
  courseId?: string
  agentType?: string
  limit?: number
  page?: number
}

export interface ExecutionHistoryResponse {
  executions: AIAgentExecution[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UsageStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  totalCost: number
  averageDuration: number
  byAgent: Record<string, number>
  limits: {
    canExecute: boolean
    limit: number
    used: number
    resetDate: string
  }
}

export interface UsageLimits {
  canExecute: boolean
  limit: number
  used: number
  resetDate: string
}

// API Client
export const aiAgentsApi = {
  // Get all AI agents
  async getAgents(): Promise<AIAgent[]> {
    const response = await apiClient.get('/ai-agents')
    return response.data.data
  },

  // Get specific AI agent by type
  async getAgent(type: string): Promise<AIAgent> {
    const response = await apiClient.get(`/ai-agents/${type}`)
    return response.data.data
  },

  // Execute AI agent
  async executeAgent(request: ExecutionRequest): Promise<ExecutionResult> {
    const response = await apiClient.post('/ai-agents/execute', request)
    return response.data.data
  },

  // Stream AI agent execution (Server-Sent Events)
  async streamExecution(request: ExecutionRequest): Promise<EventSource> {
    const token = localStorage.getItem('auth_token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    const eventSource = new EventSource(`${baseUrl}/api/ai-agents/execute/stream`, {
      withCredentials: true,
    })

    // Send the request data via separate POST
    // Note: SSE doesn't support request body, so we'll use regular execution for now
    // In a real implementation, you might need to pass the request ID via query params
    throw new Error('Streaming not implemented yet - use executeAgent instead')
  },

  // Get execution history
  async getExecutionHistory(params: ExecutionHistoryParams = {}): Promise<ExecutionHistoryResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.courseId) searchParams.append('courseId', params.courseId)
    if (params.agentType) searchParams.append('agentType', params.agentType)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.page) searchParams.append('page', params.page.toString())

    const response = await apiClient.get(`/ai-agents/executions?${searchParams.toString()}`)
    return response.data.data
  },

  // Get specific execution details
  async getExecution(id: string): Promise<AIAgentExecution> {
    const response = await apiClient.get(`/ai-agents/executions/${id}`)
    return response.data.data
  },

  // Cancel running execution
  async cancelExecution(id: string): Promise<void> {
    await apiClient.post(`/ai-agents/executions/${id}/cancel`)
  },

  // Get usage statistics
  async getUsageStats(period: 'day' | 'week' | 'month' = 'month'): Promise<UsageStats> {
    const response = await apiClient.get(`/ai-agents/usage?period=${period}`)
    return response.data.data
  },

  // Update AI agent configuration (Admin only)
  async updateAgent(type: string, data: Partial<AIAgent>): Promise<AIAgent> {
    const response = await apiClient.put(`/ai-agents/${type}`, data)
    return response.data.data
  },
}

// Hook for real-time execution updates
export const useExecutionStream = (executionId: string) => {
  // This would implement WebSocket or SSE connection for real-time updates
  // For now, return a placeholder
  return {
    data: null,
    error: null,
    isConnected: false,
  }
}

// Utility functions
export const getAgentIcon = (agentType: string): string => {
  const icons = {
    ARCHITECT: '🏗️',
    RESEARCH: '🔍',
    WRITING: '✍️',
    EDITING: '✏️',
    DESIGN: '🎨',
    QUALITY: '🛡️',
    MARKETING: '📈',
  }
  return icons[agentType as keyof typeof icons] || '🤖'
}

export const getAgentColor = (agentType: string): string => {
  const colors = {
    ARCHITECT: 'blue',
    RESEARCH: 'green',
    WRITING: 'purple',
    EDITING: 'orange',
    DESIGN: 'pink',
    QUALITY: 'red',
    MARKETING: 'indigo',
  }
  return colors[agentType as keyof typeof colors] || 'gray'
}

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

export const formatCost = (cost: number): string => {
  if (cost < 0.001) return `$${(cost * 1000).toFixed(2)}m` // Show as millicents
  return `$${cost.toFixed(4)}`
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED': return 'text-green-600'
    case 'FAILED': return 'text-red-600'
    case 'RUNNING': return 'text-blue-600'
    default: return 'text-gray-600'
  }
}

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'COMPLETED': return '✅'
    case 'FAILED': return '❌'
    case 'RUNNING': return '🔄'
    default: return '⏳'
  }
}