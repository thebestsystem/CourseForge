// Mock Redis implementation for development when Redis is not available

class MockRedis {
  private cache: Map<string, { value: any, expiry?: number }> = new Map()

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return typeof item.value === 'string' ? item.value : JSON.stringify(item.value)
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined
    this.cache.set(key, { value, expiry })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async ping(): Promise<string> {
    return 'PONG'
  }

  disconnect(): void {
    // Mock disconnect
  }
}

// Create a mock redis instance
const redisClient = new MockRedis()

// Mock cache helper
const cache = {
  get: (key: string) => redisClient.get(key),
  set: (key: string, value: any, ttl?: number) => redisClient.set(key, value, ttl),
  del: (key: string) => redisClient.del(key),
}

export const redis = {
  cache,
  get: (key: string) => redisClient.get(key),
  set: (key: string, value: string, ttlSeconds?: number) => redisClient.set(key, value, ttlSeconds),
}

export { redisClient }