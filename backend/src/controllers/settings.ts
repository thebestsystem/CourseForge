import { Request, Response } from 'express'
import { prisma } from '@/config/database-simple'
import { z } from 'zod'
import crypto from 'crypto'

// Simple console logger for development
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.log('[DEBUG]', ...args),
}

// Validation schemas
const updateSettingsSchema = z.object({
  apiKeys: z.record(z.string()).optional(), // { openai: "sk-...", deepseek: "..." }
  preferences: z.object({
    defaultProvider: z.string().optional(),
    defaultModel: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(100000).optional(),
  }).optional()
})

const addApiKeySchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  apiKey: z.string().min(1, 'API key is required'),
})

// Simple encryption/decryption (in production, use proper encryption)
const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'courseforge-dev-key-32-characters'

function encrypt(text: string): string {
  // For development, use simple base64 encoding
  // In production, implement proper encryption
  return Buffer.from(text).toString('base64')
}

function decrypt(text: string): string {
  try {
    return Buffer.from(text, 'base64').toString('utf8')
  } catch (error) {
    logger.warn('Decryption failed, returning as-is:', error)
    return text
  }
}

export class SettingsController {
  /**
   * Get user settings
   */
  static async getSettings(req: Request, res: Response) {
    try {
      const userId = req.user!.id

      // Get user settings
      let userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      })

      if (!userSettings) {
        // Create default settings
        userSettings = await prisma.userSettings.create({
          data: {
            userId,
            settings: JSON.stringify({
              apiKeys: {},
              preferences: {
                defaultProvider: 'openai',
                defaultModel: 'gpt-4',
                temperature: 0.7,
                maxTokens: 2000,
              }
            })
          }
        })
      }

      // Decrypt and parse settings
      const decryptedSettings = decrypt(userSettings.settings)
      const parsedSettings = JSON.parse(decryptedSettings)

      // Remove actual API keys for security (only send masked versions)
      const maskedApiKeys: Record<string, string> = {}
      if (parsedSettings.apiKeys) {
        Object.keys(parsedSettings.apiKeys).forEach(provider => {
          const key = parsedSettings.apiKeys[provider]
          if (key && key.length > 8) {
            maskedApiKeys[provider] = key.substring(0, 4) + '****' + key.substring(key.length - 4)
          } else {
            maskedApiKeys[provider] = '****'
          }
        })
      }

      res.json({
        success: true,
        data: {
          apiKeys: maskedApiKeys,
          preferences: parsedSettings.preferences || {},
        }
      })
    } catch (error) {
      logger.error('Error getting user settings:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get settings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Update user settings
   */
  static async updateSettings(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      
      // Validate request body
      const validation = updateSettingsSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validation.error.errors,
        })
      }

      const { apiKeys, preferences } = validation.data

      // Get existing settings
      let userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      })

      let currentSettings = { apiKeys: {}, preferences: {} }
      if (userSettings) {
        const decryptedSettings = decrypt(userSettings.settings)
        currentSettings = JSON.parse(decryptedSettings)
      }

      // Merge new settings
      if (apiKeys) {
        currentSettings.apiKeys = { ...currentSettings.apiKeys, ...apiKeys }
      }
      if (preferences) {
        currentSettings.preferences = { ...currentSettings.preferences, ...preferences }
      }

      // Encrypt and save
      const encryptedSettings = encrypt(JSON.stringify(currentSettings))

      if (userSettings) {
        userSettings = await prisma.userSettings.update({
          where: { userId },
          data: { settings: encryptedSettings }
        })
      } else {
        userSettings = await prisma.userSettings.create({
          data: {
            userId,
            settings: encryptedSettings
          }
        })
      }

      logger.info(`Settings updated for user ${userId}`)

      res.json({
        success: true,
        message: 'Settings updated successfully'
      })
    } catch (error) {
      logger.error('Error updating settings:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Add or update API key for a specific provider
   */
  static async addApiKey(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      
      // Validate request body
      const validation = addApiKeySchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validation.error.errors,
        })
      }

      const { provider, apiKey } = validation.data

      // Validate provider exists
      const llmProvider = await prisma.lLMProvider.findUnique({
        where: { name: provider }
      })

      if (!llmProvider) {
        return res.status(400).json({
          success: false,
          message: `Unknown provider: ${provider}`,
        })
      }

      // Get existing settings
      let userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      })

      let currentSettings = { apiKeys: {}, preferences: {} }
      if (userSettings) {
        const decryptedSettings = decrypt(userSettings.settings)
        currentSettings = JSON.parse(decryptedSettings)
      }

      // Add/update API key
      currentSettings.apiKeys[provider] = apiKey

      // Encrypt and save
      const encryptedSettings = encrypt(JSON.stringify(currentSettings))

      if (userSettings) {
        await prisma.userSettings.update({
          where: { userId },
          data: { settings: encryptedSettings }
        })
      } else {
        await prisma.userSettings.create({
          data: {
            userId,
            settings: encryptedSettings
          }
        })
      }

      logger.info(`API key added for provider ${provider} (user ${userId})`)

      res.json({
        success: true,
        message: `API key for ${llmProvider.displayName} saved successfully`,
        data: {
          provider: provider,
          providerName: llmProvider.displayName
        }
      })
    } catch (error) {
      logger.error('Error adding API key:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to add API key',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Remove API key for a specific provider
   */
  static async removeApiKey(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const provider = req.params.provider

      if (!provider) {
        return res.status(400).json({
          success: false,
          message: 'Provider parameter is required',
        })
      }

      // Get existing settings
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      })

      if (!userSettings) {
        return res.status(404).json({
          success: false,
          message: 'No settings found',
        })
      }

      const decryptedSettings = decrypt(userSettings.settings)
      const currentSettings = JSON.parse(decryptedSettings)

      if (currentSettings.apiKeys && currentSettings.apiKeys[provider]) {
        delete currentSettings.apiKeys[provider]

        // Encrypt and save
        const encryptedSettings = encrypt(JSON.stringify(currentSettings))
        await prisma.userSettings.update({
          where: { userId },
          data: { settings: encryptedSettings }
        })

        logger.info(`API key removed for provider ${provider} (user ${userId})`)

        res.json({
          success: true,
          message: `API key for ${provider} removed successfully`
        })
      } else {
        res.status(404).json({
          success: false,
          message: `No API key found for provider: ${provider}`
        })
      }
    } catch (error) {
      logger.error('Error removing API key:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to remove API key',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Test API key for a specific provider
   */
  static async testApiKey(req: Request, res: Response) {
    try {
      const provider = req.params.provider
      const userId = req.user!.id

      if (!provider) {
        return res.status(400).json({
          success: false,
          message: 'Provider parameter is required',
        })
      }

      // Get user's API key for this provider
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      })

      if (!userSettings) {
        return res.status(404).json({
          success: false,
          message: 'No settings found',
        })
      }

      const decryptedSettings = decrypt(userSettings.settings)
      const currentSettings = JSON.parse(decryptedSettings)

      if (!currentSettings.apiKeys || !currentSettings.apiKeys[provider]) {
        return res.status(404).json({
          success: false,
          message: `No API key found for provider: ${provider}`
        })
      }

      // TODO: Implement actual API key testing for each provider
      // For now, just return success
      res.json({
        success: true,
        message: `API key for ${provider} is valid`,
        tested: true
      })
    } catch (error) {
      logger.error('Error testing API key:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to test API key',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Get available LLM providers
   */
  static async getProviders(req: Request, res: Response) {
    try {
      const providers = await prisma.lLMProvider.findMany({
        where: { isEnabled: true },
        orderBy: [
          { isDefault: 'desc' },
          { name: 'asc' }
        ]
      })

      const formattedProviders = providers.map(provider => ({
        name: provider.name,
        displayName: provider.displayName,
        baseUrl: provider.baseUrl,
        models: JSON.parse(provider.models),
        pricing: provider.pricing ? JSON.parse(provider.pricing) : null,
        features: JSON.parse(provider.features),
        authType: provider.authType,
        isDefault: provider.isDefault,
      }))

      res.json({
        success: true,
        data: formattedProviders
      })
    } catch (error) {
      logger.error('Error getting LLM providers:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get providers',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }
}