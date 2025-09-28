import Redis from 'ioredis'
import { logger } from '@/utils/logger'

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'courseforge:',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
}

// Create Redis client
export const redisClient = new Redis(redisConfig)

// Redis connection event handlers
redisClient.on('connect', () => {
  logger.info('✅ Redis connected successfully')
})

redisClient.on('ready', () => {
  logger.info('✅ Redis is ready to receive commands')
})

redisClient.on('error', (error) => {
  logger.error('❌ Redis connection error:', error)
})

redisClient.on('close', () => {
  logger.warn('⚠️  Redis connection closed')
})

redisClient.on('reconnecting', () => {
  logger.info('🔄 Redis reconnecting...')
})

// Redis utility functions
export const redis = {
  // Basic operations
  get: async (key: string): Promise<string | null> => {
    try {
      return await redisClient.get(key)
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error)
      return null
    }
  },

  set: async (key: string, value: string, ttl?: number): Promise<boolean> => {
    try {
      if (ttl) {
        await redisClient.setex(key, ttl, value)
      } else {
        await redisClient.set(key, value)
      }
      return true
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error)
      return false
    }
  },

  del: async (key: string): Promise<boolean> => {
    try {
      const result = await redisClient.del(key)
      return result > 0
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error)
      return false
    }
  },

  exists: async (key: string): Promise<boolean> => {
    try {
      const result = await redisClient.exists(key)
      return result > 0
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error)
      return false
    }
  },

  expire: async (key: string, ttl: number): Promise<boolean> => {
    try {
      const result = await redisClient.expire(key, ttl)
      return result > 0
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error)
      return false
    }
  },

  // Hash operations
  hget: async (key: string, field: string): Promise<string | null> => {
    try {
      return await redisClient.hget(key, field)
    } catch (error) {
      logger.error(`Redis HGET error for key ${key}, field ${field}:`, error)
      return null
    }
  },

  hset: async (key: string, field: string, value: string): Promise<boolean> => {
    try {
      await redisClient.hset(key, field, value)
      return true
    } catch (error) {
      logger.error(`Redis HSET error for key ${key}, field ${field}:`, error)
      return false
    }
  },

  hgetall: async (key: string): Promise<Record<string, string> | null> => {
    try {
      return await redisClient.hgetall(key)
    } catch (error) {
      logger.error(`Redis HGETALL error for key ${key}:`, error)
      return null
    }
  },

  hdel: async (key: string, field: string): Promise<boolean> => {
    try {
      const result = await redisClient.hdel(key, field)
      return result > 0
    } catch (error) {
      logger.error(`Redis HDEL error for key ${key}, field ${field}:`, error)
      return false
    }
  },

  // List operations
  lpush: async (key: string, value: string): Promise<boolean> => {
    try {
      await redisClient.lpush(key, value)
      return true
    } catch (error) {
      logger.error(`Redis LPUSH error for key ${key}:`, error)
      return false
    }
  },

  rpush: async (key: string, value: string): Promise<boolean> => {
    try {
      await redisClient.rpush(key, value)
      return true
    } catch (error) {
      logger.error(`Redis RPUSH error for key ${key}:`, error)
      return false
    }
  },

  lpop: async (key: string): Promise<string | null> => {
    try {
      return await redisClient.lpop(key)
    } catch (error) {
      logger.error(`Redis LPOP error for key ${key}:`, error)
      return null
    }
  },

  lrange: async (key: string, start: number, stop: number): Promise<string[]> => {
    try {
      return await redisClient.lrange(key, start, stop)
    } catch (error) {
      logger.error(`Redis LRANGE error for key ${key}:`, error)
      return []
    }
  },

  // Set operations
  sadd: async (key: string, member: string): Promise<boolean> => {
    try {
      const result = await redisClient.sadd(key, member)
      return result > 0
    } catch (error) {
      logger.error(`Redis SADD error for key ${key}:`, error)
      return false
    }
  },

  srem: async (key: string, member: string): Promise<boolean> => {
    try {
      const result = await redisClient.srem(key, member)
      return result > 0
    } catch (error) {
      logger.error(`Redis SREM error for key ${key}:`, error)
      return false
    }
  },

  smembers: async (key: string): Promise<string[]> => {
    try {
      return await redisClient.smembers(key)
    } catch (error) {
      logger.error(`Redis SMEMBERS error for key ${key}:`, error)
      return []
    }
  },

  // JSON operations (if using RedisJSON module)
  jsonGet: async (key: string, path: string = '.'): Promise<any> => {
    try {
      const result = await redisClient.call('JSON.GET', key, path)
      return result ? JSON.parse(result as string) : null
    } catch (error) {
      logger.error(`Redis JSON.GET error for key ${key}:`, error)
      return null
    }
  },

  jsonSet: async (key: string, path: string, value: any): Promise<boolean> => {
    try {
      await redisClient.call('JSON.SET', key, path, JSON.stringify(value))
      return true
    } catch (error) {
      logger.error(`Redis JSON.SET error for key ${key}:`, error)
      return false
    }
  },

  // Cache helpers
  cache: {
    get: async <T>(key: string): Promise<T | null> => {
      try {
        const value = await redisClient.get(key)
        return value ? JSON.parse(value) : null
      } catch (error) {
        logger.error(`Cache GET error for key ${key}:`, error)
        return null
      }
    },

    set: async <T>(key: string, value: T, ttl: number = 3600): Promise<boolean> => {
      try {
        await redisClient.setex(key, ttl, JSON.stringify(value))
        return true
      } catch (error) {
        logger.error(`Cache SET error for key ${key}:`, error)
        return false
      }
    },

    invalidate: async (pattern: string): Promise<void> => {
      try {
        const keys = await redisClient.keys(pattern)
        if (keys.length > 0) {
          await redisClient.del(...keys)
        }
      } catch (error) {
        logger.error(`Cache invalidate error for pattern ${pattern}:`, error)
      }
    },

    // Cache with fallback function
    getOrSet: async <T>(
      key: string,
      fallback: () => Promise<T>,
      ttl: number = 3600
    ): Promise<T> => {
      try {
        // Try to get from cache first
        const cached = await redis.cache.get<T>(key)
        if (cached !== null) {
          return cached
        }

        // If not in cache, execute fallback
        const value = await fallback()
        
        // Store in cache
        await redis.cache.set(key, value, ttl)
        
        return value
      } catch (error) {
        logger.error(`Cache getOrSet error for key ${key}:`, error)
        // If cache fails, still execute fallback
        return await fallback()
      }
    },
  },

  // Health check
  ping: async (): Promise<boolean> => {
    try {
      const result = await redisClient.ping()
      return result === 'PONG'
    } catch (error) {
      logger.error('Redis PING error:', error)
      return false
    }
  },

  // Get Redis info
  info: async (): Promise<string | null> => {
    try {
      return await redisClient.info()
    } catch (error) {
      logger.error('Redis INFO error:', error)
      return null
    }
  },
}

// Session management helpers
export const sessionKeys = {
  user: (userId: string) => `user:${userId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user:${userId}:sessions`,
}

// Cache key helpers
export const cacheKeys = {
  user: (userId: string) => `cache:user:${userId}`,
  course: (courseId: string) => `cache:course:${courseId}`,
  courses: (userId: string) => `cache:courses:user:${userId}`,
  aiAgent: (agentType: string) => `cache:ai-agent:${agentType}`,
  analytics: (type: string, period: string) => `cache:analytics:${type}:${period}`,
}

export default redisClient