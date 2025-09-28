import OpenAI from 'openai'
import { redis } from '@/config/redis-mock'
import { prisma } from '@/config/database-simple'

// Simple console logger for development
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.log('[DEBUG]', ...args),
}
// Using string types since we're using simplified schema without enums
type AIAgentType = 'ARCHITECT' | 'RESEARCH' | 'WRITING' | 'EDITING' | 'DESIGN' | 'QUALITY' | 'MARKETING'
type AIExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED'

// AI Model Providers
export enum AIProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  HUGGINGFACE = 'huggingface',
  COHERE = 'cohere',
}

export interface AIModelConfig {
  provider: AIProvider
  model: string
  maxTokens: number
  temperature: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface AIExecutionRequest {
  agentType: AIAgentType
  prompt: string
  context?: Record<string, any>
  courseId?: string
  userId: string
  provider?: string
  modelConfig?: Partial<AIModelConfig>
}

export interface AIExecutionResult {
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

export class AIEngine {
  private openai: OpenAI
  private defaultConfig: AIModelConfig
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    this.defaultConfig = {
      provider: AIProvider.OPENAI,
      model: process.env.DEFAULT_AI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    }
  }

  /**
   * Execute AI agent with specified configuration
   */
  async executeAgent(request: AIExecutionRequest): Promise<AIExecutionResult> {
    const startTime = Date.now()
    
    // Get agent configuration from database
    const agent = await prisma.aIAgent.findUnique({
      where: { type: request.agentType },
    })

    if (!agent || !agent.isEnabled) {
      throw new Error(`AI Agent ${request.agentType} is not available or disabled`)
    }

    // Create execution record
    const execution = await prisma.aIAgentExecution.create({
      data: {
        agentType: request.agentType,
        courseId: request.courseId,
        userId: request.userId,
        input: JSON.stringify({
          prompt: request.prompt,
          context: request.context || {},
          modelConfig: { ...this.defaultConfig, ...request.modelConfig },
        }),
        status: 'RUNNING',
      },
    })

    try {
      // Merge configurations
      const modelConfig: AIModelConfig = {
        ...this.defaultConfig,
        model: agent.model,
        maxTokens: agent.maxTokens,
        temperature: agent.temperature,
        ...request.modelConfig,
      }

      // Build the complete prompt with system prompt and context
      const systemPrompt = agent.systemPrompt
      const contextualPrompt = this.buildContextualPrompt(
        systemPrompt,
        request.prompt,
        request.context
      )

      // Get user settings for provider selection
      const userSettings = await this.getUserSettings(request.userId)
      const selectedProvider = request.provider || userSettings.preferences.defaultProvider || 'openai'
      
      // Create AI client for selected provider
      const aiClient = await this.createAIClient(request.userId, selectedProvider)
      
      // Execute with the selected provider
      let result: AIExecutionResult
      result = await this.executeWithClient(aiClient, contextualPrompt, modelConfig, execution.id, selectedProvider)

      const duration = Date.now() - startTime

      // Update execution record with results
      await prisma.aIAgentExecution.update({
        where: { id: execution.id },
        data: {
          output: JSON.stringify({
            content: result.content,
            usage: result.usage,
            metadata: result.metadata,
          }),
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          cost: result.cost,
        },
      })

      // Cache the result
      await redis.cache.set(
        `ai_execution:${execution.id}`,
        result,
        60 * 60 * 24 // 24 hours
      )

      // Log execution
      logger.aiAgent(request.agentType, 'completed', execution.id)

      return {
        ...result,
        executionId: execution.id,
        duration,
      }

    } catch (error) {
      // Update execution record with error
      await prisma.aIAgentExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration: Date.now() - startTime,
        },
      })

      logger.error(`AI Agent execution failed: ${error}`, { executionId: execution.id })
      throw error
    }
  }

  /**
   * Execute using OpenAI API
   */
  private async executeWithClient(
    aiClient: any,
    prompt: string,
    config: AIModelConfig,
    executionId: string,
    provider: string
  ): Promise<Omit<AIExecutionResult, 'executionId' | 'duration'>> {
    try {
      logger.info(`Executing with provider: ${provider}, model: ${config.model}`)
      
      // Check if this is a demo/example API key - return mock response
      if (this.isDemoApiKey(aiClient.apiKey)) {
        return this.generateMockResponse(prompt, provider)
      }
      
      // All providers we support use OpenAI-compatible API
      const response = await aiClient.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
      })

      const usage = response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      }

      const cost = this.calculateCost(config.provider, config.model, usage.total_tokens)

      return {
        content: response.choices[0]?.message?.content || '',
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        cost,
        metadata: {
          model: config.model,
          finishReason: response.choices[0]?.finish_reason,
          responseId: response.id,
        },
      }
    } catch (error) {
      logger.error(`${provider} API error:`, error)
      throw new Error(`${provider} execution failed: ${error.message}`)
    }
  }

  /**
   * Check if API key is a demo/example key
   */
  private isDemoApiKey(apiKey: string): boolean {
    if (!apiKey) return false
    
    const demoPatterns = [
      'example',
      'demo',
      'test',
      'sk-deepseek-example',
      'sk-openai-example',
      'your_openai_api_key_here'
    ]
    
    return demoPatterns.some(pattern => apiKey.toLowerCase().includes(pattern.toLowerCase()))
  }

  /**
   * Generate realistic mock response for demo purposes
   */
  private generateMockResponse(prompt: string, provider: string): Omit<AIExecutionResult, 'executionId' | 'duration'> {
    const mockResponses = {
      course_outline: `# Course Outline: Introduction to Web Development

## Module 1: Fundamentals (Week 1-2)
- HTML5 structure and semantics
- CSS3 styling and layouts
- Responsive design principles
- Browser developer tools

## Module 2: Interactive Web (Week 3-4)
- JavaScript fundamentals
- DOM manipulation
- Event handling
- Basic animations and effects

## Module 3: Modern Development (Week 5-6)
- Version control with Git
- Package managers (npm)
- Build tools and workflows
- Testing basics

## Module 4: Frameworks & Deployment (Week 7-8)
- Introduction to React.js
- Component-based architecture
- State management
- Deployment strategies

**Assessment:** Project-based portfolio with 4 progressive builds
**Prerequisites:** Basic computer literacy
**Duration:** 8 weeks (3-4 hours/week)`,

      content_writing: `Creating engaging and informative content about web development requires understanding your audience and their learning journey. Here's a comprehensive approach:

**Learning Objectives:**
Students will be able to build responsive websites using HTML, CSS, and JavaScript, understanding modern development workflows and best practices.

**Key Topics to Cover:**
1. **Foundation Building** - Start with semantic HTML and modern CSS
2. **Interactivity** - Progressive introduction to JavaScript concepts
3. **Real-world Skills** - Version control, debugging, and deployment
4. **Future Pathways** - Framework introduction and career guidance

**Engagement Strategies:**
- Hands-on coding exercises with immediate visual feedback
- Progressive project building (portfolio site)
- Code reviews and peer collaboration
- Industry-relevant examples and case studies

This content structure ensures students build confidence while developing practical skills that translate directly to real-world applications.`,

      research: `Based on current industry trends and educational best practices for web development education:

**Market Demand Analysis:**
- Web development jobs projected to grow 13% (2020-2030)
- Average entry-level salary: $55,000-$70,000
- Remote work availability: 85% of positions offer remote options

**Skill Requirements Research:**
- HTML/CSS: Fundamental requirement (100% of positions)
- JavaScript: Critical for 95% of modern web roles
- Version Control (Git): Expected in 90% of job postings
- Framework knowledge: React leads at 35% market share

**Educational Approach Recommendations:**
- Project-based learning increases retention by 40%
- Peer coding sessions improve problem-solving skills
- Industry mentorship programs boost job placement rates
- Portfolio development essential for hiring success

**Competitive Analysis:**
- FreeCodeCamp: 400M+ users, project-focused
- Codecademy: Interactive lessons, subscription model
- The Odin Project: Open source, comprehensive curriculum

This research supports a practical, project-driven approach with strong community elements.`,

      default: `Thank you for your prompt! As an AI agent specialized in course creation, I'm here to help you develop high-quality educational content.

Your request has been processed successfully. Based on the prompt you provided, I would recommend:

1. **Clear Learning Objectives** - Define what students should achieve
2. **Structured Content Flow** - Logical progression from basics to advanced
3. **Practical Applications** - Real-world examples and hands-on exercises
4. **Assessment Strategy** - Multiple ways to evaluate understanding
5. **Engagement Elements** - Interactive components to maintain interest

I'm ready to dive deeper into any specific aspect of your course development needs. Would you like me to elaborate on any particular area or help with specific content creation?`
    }

    // Determine response type based on prompt content
    let responseKey = 'default'
    const promptLower = prompt.toLowerCase()
    
    if (promptLower.includes('outline') || promptLower.includes('structure')) {
      responseKey = 'course_outline'
    } else if (promptLower.includes('content') || promptLower.includes('writing')) {
      responseKey = 'content_writing'  
    } else if (promptLower.includes('research') || promptLower.includes('analyze')) {
      responseKey = 'research'
    }

    const content = mockResponses[responseKey] || mockResponses.default

    // Generate realistic usage metrics
    const promptTokens = Math.floor(prompt.length / 4) // Rough estimate
    const completionTokens = Math.floor(content.length / 4)
    const totalTokens = promptTokens + completionTokens

    // Calculate mock cost based on provider
    const mockCost = provider === 'deepseek' ? totalTokens * 0.00014 / 1000 : // DeepSeek pricing
                     provider === 'openai' ? totalTokens * 0.01 / 1000 : // OpenAI pricing
                     totalTokens * 0.001 / 1000 // Generic pricing

    return {
      content,
      usage: {
        promptTokens,
        completionTokens, 
        totalTokens,
      },
      cost: mockCost,
      model: config.model,
      finishReason: 'stop',
      responseId: `mock_${executionId}_${Date.now()}`,
    }
  }

  /**
   * Execute using Claude API (Anthropic)
   */
  private async executeClaude(
    prompt: string,
    config: AIModelConfig,
    executionId: string
  ): Promise<Omit<AIExecutionResult, 'executionId' | 'duration'>> {
    // Note: This is a placeholder implementation
    // You would need to install @anthropic-ai/sdk and implement Claude integration
    throw new Error('Claude integration not yet implemented')
  }

  /**
   * Build contextual prompt with system instructions and context
   */
  private buildContextualPrompt(
    systemPrompt: string,
    userPrompt: string,
    context?: Record<string, any>
  ): string {
    let prompt = `${systemPrompt}\n\n`

    if (context && Object.keys(context).length > 0) {
      prompt += `Context Information:\n${JSON.stringify(context, null, 2)}\n\n`
    }

    prompt += `User Request:\n${userPrompt}`

    return prompt
  }

  /**
   * Calculate cost based on provider and usage
   */
  private calculateCost(provider: AIProvider, model: string, totalTokens: number): number {
    // Cost calculation based on provider pricing
    // These are example rates - update with actual pricing
    const rates: Record<string, number> = {
      'gpt-4': 0.00006, // $0.06 per 1K tokens
      'gpt-4-turbo': 0.00003, // $0.03 per 1K tokens
      'gpt-3.5-turbo': 0.000002, // $0.002 per 1K tokens
      'claude-3-opus': 0.000075, // $0.075 per 1K tokens
      'claude-3-sonnet': 0.000015, // $0.015 per 1K tokens
    }

    const rate = rates[model] || rates['gpt-3.5-turbo']
    return (totalTokens / 1000) * rate
  }

  /**
   * Get execution history for a user or course
   */
  async getExecutionHistory(
    userId: string,
    courseId?: string,
    agentType?: AIAgentType,
    limit: number = 50
  ) {
    const where: any = { userId }
    
    if (courseId) where.courseId = courseId
    if (agentType) where.agentType = agentType

    return await prisma.aIAgentExecution.findMany({
      where,
      include: {
        agent: {
          select: {
            name: true,
            description: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    })
  }

  /**
   * Get AI usage statistics
   */
  async getUsageStats(userId: string, period: 'day' | 'week' | 'month' = 'month') {
    const startDate = new Date()
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }

    const executions = await prisma.aIAgentExecution.findMany({
      where: {
        userId,
        startedAt: {
          gte: startDate,
        },
      },
      select: {
        agentType: true,
        status: true,
        cost: true,
        duration: true,
      },
    })

    const stats = {
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.status === 'COMPLETED').length,
      failedExecutions: executions.filter(e => e.status === 'FAILED').length,
      totalCost: executions.reduce((sum, e) => sum + (e.cost || 0), 0),
      averageDuration: executions.length > 0 
        ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length 
        : 0,
      byAgent: {} as Record<AIAgentType, number>,
    }

    // Group by agent type
    for (const execution of executions) {
      if (!stats.byAgent[execution.agentType]) {
        stats.byAgent[execution.agentType] = 0
      }
      stats.byAgent[execution.agentType]++
    }

    return stats
  }

  /**
   * Get user's decrypted settings including API keys
   */
  private async getUserSettings(userId: string): Promise<{
    apiKeys: Record<string, string>
    preferences: {
      defaultProvider?: string
      defaultModel?: string
      temperature?: number
      maxTokens?: number
    }
  }> {
    try {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      })

      if (!userSettings) {
        return {
          apiKeys: {},
          preferences: {
            defaultProvider: 'openai',
            defaultModel: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2000,
          }
        }
      }

      // Simple decryption (in production, use proper encryption)
      let decryptedSettings
      try {
        const settingsText = userSettings.settings
        // Try to decode base64 first, then fallback to plain JSON
        try {
          decryptedSettings = JSON.parse(Buffer.from(settingsText, 'base64').toString('utf8'))
        } catch (base64Error) {
          decryptedSettings = JSON.parse(settingsText)
        }
      } catch (error) {
        logger.warn('Failed to decrypt settings, using defaults:', error)
        decryptedSettings = {
          apiKeys: {},
          preferences: {
            defaultProvider: 'openai',
            defaultModel: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2000,
          }
        }
      }

      return {
        apiKeys: decryptedSettings.apiKeys || {},
        preferences: decryptedSettings.preferences || {}
      }
    } catch (error) {
      logger.error('Error getting user settings:', error)
      return {
        apiKeys: {},
        preferences: {
          defaultProvider: 'openai',
          defaultModel: 'gpt-4', 
          temperature: 0.7,
          maxTokens: 2000,
        }
      }
    }
  }

  /**
   * Create AI client based on user's selected provider
   */
  private async createAIClient(userId: string, provider?: string): Promise<any> {
    const settings = await this.getUserSettings(userId)
    const selectedProvider = provider || settings.preferences.defaultProvider || 'openai'

    // Get provider configuration
    const providerConfig = await prisma.lLMProvider.findUnique({
      where: { name: selectedProvider }
    })

    if (!providerConfig) {
      throw new Error(`Unknown provider: ${selectedProvider}`)
    }

    // Get user's API key for this provider
    const apiKey = settings.apiKeys[selectedProvider]
    if (!apiKey && providerConfig.authType !== 'NONE') {
      throw new Error(`No API key found for ${providerConfig.displayName}. Please add your API key in settings.`)
    }

    // Create client based on provider
    switch (selectedProvider) {
      case 'openai':
        return new OpenAI({
          apiKey: apiKey || process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
          baseURL: providerConfig.baseUrl,
        })

      case 'deepseek':
        return new OpenAI({
          apiKey: apiKey,
          baseURL: providerConfig.baseUrl,
        })

      case 'groq':
        return new OpenAI({
          apiKey: apiKey,
          baseURL: providerConfig.baseUrl,
        })

      // Add more providers as needed
      default:
        // Default to OpenAI-compatible client
        return new OpenAI({
          apiKey: apiKey,
          baseURL: providerConfig.baseUrl,
        })
    }
  }

  /**
   * Check if user has reached usage limits
   */
  async checkUsageLimits(userId: string): Promise<{
    canExecute: boolean
    limit: number
    used: number
    resetDate: Date
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Define limits based on subscription plan
    const limits = {
      FREE: 10,
      BASIC: 100,
      PRO: 1000,
      ENTERPRISE: -1, // unlimited
    }

    const limit = limits[user.subscription?.plan || 'FREE']
    
    if (limit === -1) {
      return {
        canExecute: true,
        limit: -1,
        used: 0,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    }

    // Count executions this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const used = await prisma.aIAgentExecution.count({
      where: {
        userId,
        startedAt: {
          gte: startOfMonth,
        },
        status: 'COMPLETED',
      },
    })

    const nextMonth = new Date(startOfMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    return {
      canExecute: used < limit,
      limit,
      used,
      resetDate: nextMonth,
    }
  }

  /**
   * Stream AI response (for real-time updates)
   */
  async streamExecution(request: AIExecutionRequest): Promise<AsyncGenerator<string, void, unknown>> {
    // This would implement streaming responses for real-time UI updates
    // For now, return a simple generator that yields the full response
    const result = await this.executeAgent(request)
    
    async function* generator() {
      yield result.content
    }
    
    return generator()
  }
}

export const aiEngine = new AIEngine()