'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Search, 
  PenTool, 
  FileEdit, 
  Palette, 
  Shield, 
  TrendingUp,
  Play,
  History,
  Settings,
  BarChart3,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { aiAgentsApi, type AIAgent, type AIAgentExecution, type UsageStats } from '@/lib/api/ai-agents'
import { AIAgentExecutionDialog } from '@/components/ai-agents/execution-dialog'
import { ExecutionHistoryTable } from '@/components/ai-agents/execution-history'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Agent type to icon mapping
const AGENT_ICONS = {
  ARCHITECT: Brain,
  RESEARCH: Search,
  WRITING: PenTool,
  EDITING: FileEdit,
  DESIGN: Palette,
  QUALITY: Shield,
  MARKETING: TrendingUp,
}

// Agent type to color mapping
const AGENT_COLORS = {
  ARCHITECT: 'bg-blue-100 text-blue-700 border-blue-200',
  RESEARCH: 'bg-green-100 text-green-700 border-green-200',
  WRITING: 'bg-purple-100 text-purple-700 border-purple-200',
  EDITING: 'bg-orange-100 text-orange-700 border-orange-200',
  DESIGN: 'bg-pink-100 text-pink-700 border-pink-200',
  QUALITY: 'bg-red-100 text-red-700 border-red-200',
  MARKETING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
}

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [executions, setExecutions] = useState<AIAgentExecution[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [agentsData, usageData, executionsData] = await Promise.all([
        aiAgentsApi.getAgents(),
        aiAgentsApi.getUsageStats(),
        aiAgentsApi.getExecutionHistory({ limit: 10 })
      ])
      
      setAgents(agentsData)
      setUsageStats(usageData)
      setExecutions(executionsData.executions)
    } catch (error) {
      console.error('Error loading AI agents data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load AI agents data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteAgent = (agent: AIAgent) => {
    setSelectedAgent(agent)
    setExecutionDialogOpen(true)
  }

  const handleExecutionSuccess = (result: any) => {
    toast({
      title: 'Success',
      description: `${selectedAgent?.name} executed successfully`,
    })
    loadData() // Refresh data
    setExecutionDialogOpen(false)
  }

  const handleExecutionError = (error: string) => {
    toast({
      title: 'Error',
      description: error,
      variant: 'destructive',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const getUsagePercentage = () => {
    if (!usageStats?.limits) return 0
    if (usageStats.limits.limit === -1) return 0
    return (usageStats.limits.used / usageStats.limits.limit) * 100
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground">
            Specialized AI agents to help you create better courses
          </p>
        </div>
        <div className="flex items-center gap-4">
          {usageStats?.limits && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Usage: {usageStats.limits.used} / {usageStats.limits.limit === -1 ? '∞' : usageStats.limits.limit}
                  </p>
                  {usageStats.limits.limit !== -1 && (
                    <Progress value={getUsagePercentage()} className="w-20 h-2" />
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Usage Stats Cards */}
          {usageStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageStats.totalExecutions}</div>
                  <p className="text-xs text-muted-foreground">
                    {usageStats.successfulExecutions} successful
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {usageStats.totalExecutions > 0 
                      ? Math.round((usageStats.successfulExecutions / usageStats.totalExecutions) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {usageStats.failedExecutions} failed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${usageStats.totalCost.toFixed(4)}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {usageStats.averageDuration > 0 
                      ? `${(usageStats.averageDuration / 1000).toFixed(1)}s`
                      : '0s'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per execution
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Agents Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => {
              const IconComponent = AGENT_ICONS[agent.type as keyof typeof AGENT_ICONS]
              const colorClass = AGENT_COLORS[agent.type as keyof typeof AGENT_COLORS]
              
              return (
                <Card key={agent.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <Badge variant={agent.isEnabled ? 'default' : 'secondary'}>
                        {agent.isEnabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Capabilities */}
                    <div>
                      <p className="text-sm font-medium mb-2">Capabilities:</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 3).map((capability, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.capabilities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Model Info */}
                    <div className="text-xs text-muted-foreground">
                      Model: {agent.model} | Temp: {agent.temperature} | Max: {agent.maxTokens}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => handleExecuteAgent(agent)}
                        disabled={!agent.isEnabled}
                        className="flex-1"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Execute
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Execution History
              </CardTitle>
              <CardDescription>
                Recent AI agent executions and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExecutionHistoryTable 
                executions={executions}
                onRefresh={loadData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage by Agent Type</CardTitle>
                <CardDescription>
                  Distribution of executions across different AI agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usageStats?.byAgent && Object.keys(usageStats.byAgent).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(usageStats.byAgent).map(([agentType, count]) => {
                      const agent = agents.find(a => a.type === agentType)
                      const IconComponent = AGENT_ICONS[agentType as keyof typeof AGENT_ICONS]
                      const percentage = usageStats.totalExecutions > 0 
                        ? (count / usageStats.totalExecutions) * 100 
                        : 0
                      
                      return (
                        <div key={agentType} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{agent?.name || agentType}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{count} executions</span>
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No execution data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Execution Dialog */}
      {selectedAgent && (
        <AIAgentExecutionDialog
          agent={selectedAgent}
          open={executionDialogOpen}
          onClose={() => setExecutionDialogOpen(false)}
          onSuccess={handleExecutionSuccess}
          onError={handleExecutionError}
        />
      )}
    </div>
  )
}