import { apiClient, API_ENDPOINTS } from './api'

// Types for LLM providers and settings
export interface LLMProvider {
  name: string
  displayName: string
  baseUrl?: string
  models: string[]
  pricing?: {
    input: number
    output: number
    currency: string
  }
  features: string[]
  authType: 'API_KEY' | 'BEARER_TOKEN' | 'NONE'
  isDefault: boolean
}

export interface UserSettings {
  apiKeys: Record<string, string> // Provider name -> Masked API key
  preferences: {
    defaultProvider?: string
    defaultModel?: string
    temperature?: number
    maxTokens?: number
  }
}

export interface AddApiKeyRequest {
  provider: string
  apiKey: string
}

export interface AddApiKeyResponse {
  provider: string
  providerName: string
}

export interface TestApiKeyResponse {
  tested: boolean
  message: string
}

// Settings API service
export const settingsService = {
  /**
   * Get all available LLM providers
   */
  getProviders: async (): Promise<LLMProvider[]> => {
    return apiClient.get<LLMProvider[]>(API_ENDPOINTS.SETTINGS.PROVIDERS)
  },

  /**
   * Get user settings (API keys are masked for security)
   */
  getSettings: async (): Promise<UserSettings> => {
    return apiClient.get<UserSettings>(API_ENDPOINTS.SETTINGS.BASE)
  },

  /**
   * Update user preferences
   */
  updateSettings: async (settings: {
    preferences?: UserSettings['preferences']
  }): Promise<void> => {
    return apiClient.put(API_ENDPOINTS.SETTINGS.BASE, settings)
  },

  /**
   * Add or update API key for a provider
   */
  addApiKey: async (request: AddApiKeyRequest): Promise<AddApiKeyResponse> => {
    return apiClient.post<AddApiKeyResponse>(API_ENDPOINTS.SETTINGS.ADD_API_KEY, request)
  },

  /**
   * Remove API key for a provider
   */
  removeApiKey: async (provider: string): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.SETTINGS.REMOVE_API_KEY(provider))
  },

  /**
   * Test API key for a provider
   */
  testApiKey: async (provider: string): Promise<TestApiKeyResponse> => {
    return apiClient.post<TestApiKeyResponse>(API_ENDPOINTS.SETTINGS.TEST_API_KEY(provider))
  },
}

export default settingsService