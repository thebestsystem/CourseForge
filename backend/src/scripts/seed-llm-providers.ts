#!/usr/bin/env npx ts-node
import { prisma } from '../config/database-simple'

interface LLMProvider {
  name: string
  displayName: string
  baseUrl?: string
  models: string[]
  pricing?: {
    input: number  // per 1K tokens
    output: number // per 1K tokens
    currency: string
  }
  features: string[]
  authType: string
  isDefault?: boolean
}

const providers: LLMProvider[] = [
  {
    name: 'openai',
    displayName: 'OpenAI GPT',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
    pricing: {
      input: 0.01,  // $0.01 per 1K input tokens for GPT-4
      output: 0.03, // $0.03 per 1K output tokens for GPT-4
      currency: 'USD'
    },
    features: ['chat', 'completion', 'function_calling', 'vision', 'json_mode'],
    authType: 'API_KEY',
    isDefault: true
  },
  {
    name: 'deepseek',
    displayName: 'DeepSeek Chat',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
    pricing: {
      input: 0.00014,  // $0.14 per 1M tokens (much cheaper!)
      output: 0.00028, // $0.28 per 1M tokens
      currency: 'USD'
    },
    features: ['chat', 'completion', 'function_calling', 'json_mode', 'coding'],
    authType: 'API_KEY'
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus', 'claude-3.5-sonnet'],
    pricing: {
      input: 0.008,  // Claude 3.5 Sonnet pricing
      output: 0.024,
      currency: 'USD'
    },
    features: ['chat', 'completion', 'function_calling', 'vision', 'long_context'],
    authType: 'API_KEY'
  },
  {
    name: 'google',
    displayName: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    pricing: {
      input: 0.000125,  // Gemini 1.5 Flash pricing (very affordable)
      output: 0.000375,
      currency: 'USD'
    },
    features: ['chat', 'completion', 'function_calling', 'vision', 'long_context', 'multimodal'],
    authType: 'API_KEY'
  },
  {
    name: 'cohere',
    displayName: 'Cohere Command',
    baseUrl: 'https://api.cohere.ai/v1',
    models: ['command-r', 'command-r-plus', 'command-light'],
    pricing: {
      input: 0.0015,   // Command R pricing
      output: 0.002,
      currency: 'USD'
    },
    features: ['chat', 'completion', 'embedding', 'search'],
    authType: 'API_KEY'
  },
  {
    name: 'groq',
    displayName: 'Groq (Fast Inference)',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
    pricing: {
      input: 0.0001,   // Very fast and cheap
      output: 0.0002,
      currency: 'USD'
    },
    features: ['chat', 'completion', 'ultra_fast', 'opensource_models'],
    authType: 'API_KEY'
  },
  {
    name: 'ollama',
    displayName: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama3', 'codellama', 'mistral', 'phi3'],
    features: ['chat', 'completion', 'local', 'offline', 'privacy'],
    authType: 'NONE'
  }
]

async function seedLLMProviders() {
  try {
    console.log('🌱 Seeding LLM providers...')

    // Clear existing providers
    await prisma.lLMProvider.deleteMany()

    // Create new providers
    for (const provider of providers) {
      const created = await prisma.lLMProvider.create({
        data: {
          name: provider.name,
          displayName: provider.displayName,
          baseUrl: provider.baseUrl,
          models: JSON.stringify(provider.models),
          pricing: provider.pricing ? JSON.stringify(provider.pricing) : null,
          features: JSON.stringify(provider.features),
          authType: provider.authType,
          isDefault: provider.isDefault || false,
        }
      })

      console.log(`✅ Created provider: ${created.displayName}`)
    }

    // Count total providers
    const count = await prisma.lLMProvider.count()
    console.log(`\n🎉 Successfully seeded ${count} LLM providers!`)
    
    // Show summary
    const allProviders = await prisma.lLMProvider.findMany({
      select: {
        displayName: true,
        models: true,
        authType: true,
        isDefault: true
      }
    })

    console.log('\n📋 Available LLM Providers:')
    allProviders.forEach(provider => {
      const models = JSON.parse(provider.models)
      const defaultIndicator = provider.isDefault ? ' (DEFAULT)' : ''
      console.log(`   • ${provider.displayName}${defaultIndicator} - ${models.length} models`)
    })

  } catch (error) {
    console.error('❌ Error seeding LLM providers:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedLLMProviders()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedLLMProviders }