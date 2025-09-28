'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { settingsService, LLMProvider, UserSettings } from '@/services/settings'
import { 
  Key, 
  Settings, 
  Brain, 
  Zap, 
  DollarSign, 
  Shield, 
  Trash2, 
  Plus,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { AITestPanel } from '@/components/settings/ai-test-panel'

export default function SettingsPage() {
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [addKeyDialog, setAddKeyDialog] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [newApiKey, setNewApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [providersData, settingsData] = await Promise.all([
        settingsService.getProviders(),
        settingsService.getSettings()
      ])
      setProviders(providersData)
      setUserSettings(settingsData)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddApiKey = async () => {
    if (!selectedProvider || !newApiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a provider and enter an API key.',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await settingsService.addApiKey({
        provider: selectedProvider,
        apiKey: newApiKey.trim()
      })

      toast({
        title: 'Success',
        description: `API key for ${result.providerName} added successfully!`,
      })

      // Refresh settings and reset form
      await loadData()
      setAddKeyDialog(false)
      setSelectedProvider('')
      setNewApiKey('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add API key.',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveApiKey = async (provider: string) => {
    if (!confirm('Are you sure you want to remove this API key?')) return

    try {
      await settingsService.removeApiKey(provider)
      toast({
        title: 'Success',
        description: 'API key removed successfully.',
      })
      await loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove API key.',
        variant: 'destructive',
      })
    }
  }

  const handleTestApiKey = async (provider: string) => {
    setTestingKeys(prev => ({ ...prev, [provider]: true }))

    try {
      const result = await settingsService.testApiKey(provider)
      toast({
        title: 'Test Result',
        description: result.message,
        variant: result.tested ? 'default' : 'destructive',
      })
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.response?.data?.message || 'Failed to test API key.',
        variant: 'destructive',
      })
    } finally {
      setTestingKeys(prev => ({ ...prev, [provider]: false }))
    }
  }

  const handleDefaultProviderChange = async (provider: string) => {
    try {
      await settingsService.updateSettings({
        preferences: {
          ...userSettings?.preferences,
          defaultProvider: provider
        }
      })
      await loadData()
      toast({
        title: 'Success',
        description: 'Default provider updated successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update default provider.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    )
  }

  const availableProviders = providers.filter(p => 
    !userSettings?.apiKeys[p.name] && p.authType !== 'NONE'
  )

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-keys" className="flex items-center space-x-2">
            <Key className="w-4 h-4" />
            <span>API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>LLM Providers</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Preferences</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>API Key Management</span>
                  </CardTitle>
                  <CardDescription>
                    Securely store your API keys for different LLM providers. Keys are encrypted and only you can see them.
                  </CardDescription>
                </div>
                <Dialog open={addKeyDialog} onOpenChange={setAddKeyDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Add API Key</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add API Key</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="provider">LLM Provider</Label>
                        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProviders.map((provider) => (
                              <SelectItem key={provider.name} value={provider.name}>
                                <div className="flex items-center space-x-2">
                                  <span>{provider.displayName}</span>
                                  {provider.pricing && (
                                    <Badge variant="secondary" className="text-xs">
                                      ${provider.pricing.input * 1000}/1M tokens
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <div className="relative">
                          <Input
                            id="apiKey"
                            type={showApiKey ? "text" : "password"}
                            value={newApiKey}
                            onChange={(e) => setNewApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setAddKeyDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddApiKey}>
                          Add Key
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {userSettings?.apiKeys && Object.keys(userSettings.apiKeys).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(userSettings.apiKeys).map(([providerName, maskedKey]) => {
                    const provider = providers.find(p => p.name === providerName)
                    const isDefault = userSettings.preferences?.defaultProvider === providerName
                    
                    return (
                      <div key={providerName} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Brain className="w-5 h-5 text-blue-500" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{provider?.displayName || providerName}</span>
                              {isDefault && <Badge variant="default">Default</Badge>}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{maskedKey}</span>
                              {provider?.pricing && (
                                <Badge variant="outline" className="text-xs">
                                  ${provider.pricing.input * 1000}/1M tokens
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestApiKey(providerName)}
                            disabled={testingKeys[providerName]}
                          >
                            {testingKeys[providerName] ? <LoadingSpinner className="w-3 h-3" /> : 'Test'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveApiKey(providerName)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No API keys configured yet. Add your first API key to start using AI agents with your preferred provider.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available LLM Providers</CardTitle>
              <CardDescription>
                Choose from various AI providers with different capabilities and pricing options.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {providers.map((provider) => {
                  const hasApiKey = userSettings?.apiKeys?.[provider.name]
                  const isDefault = provider.isDefault || userSettings?.preferences?.defaultProvider === provider.name
                  
                  return (
                    <Card key={provider.name} className={`relative ${hasApiKey ? 'border-green-200 bg-green-50/50' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{provider.displayName}</CardTitle>
                          <div className="flex space-x-1">
                            {isDefault && <Badge variant="default">Default</Badge>}
                            {hasApiKey && <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>}
                          </div>
                        </div>
                        {provider.pricing && (
                          <div className="flex items-center space-x-2 text-sm">
                            <DollarSign className="w-4 h-4" />
                            <span>${(provider.pricing.input * 1000).toFixed(2)}/1M input tokens</span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Models:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {provider.models.slice(0, 3).map((model) => (
                                <Badge key={model} variant="outline" className="text-xs">
                                  {model}
                                </Badge>
                              ))}
                              {provider.models.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{provider.models.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Features:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {provider.features.slice(0, 4).map((feature) => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {hasApiKey && !isDefault && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => handleDefaultProviderChange(provider.name)}
                            >
                              Set as Default
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Preferences</CardTitle>
                <CardDescription>
                  Configure your default settings for AI agent interactions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="defaultProvider">Default LLM Provider</Label>
                    <Select 
                      value={userSettings?.preferences?.defaultProvider || ''} 
                      onValueChange={handleDefaultProviderChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers
                          .filter(p => userSettings?.apiKeys?.[p.name])
                          .map((provider) => (
                          <SelectItem key={provider.name} value={provider.name}>
                            {provider.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      More preference options coming soon: default temperature, max tokens, and custom model selections.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* AI Agent Testing Panel */}
            <div className="mt-6">
              <AITestPanel />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}