import { PrismaClient } from '@prisma/client'
import { logger } from '@/utils/logger'

// Prisma client configuration
const prismaOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] as const
    : ['info', 'warn', 'error'] as const,
}

// Create Prisma client instance
export const prisma = new PrismaClient(prismaOptions)

// Database connection helper
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect()
    logger.info('✅ Database connected successfully')
  } catch (error) {
    logger.error('❌ Database connection failed:', error)
    throw error
  }
}

// Database disconnection helper
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect()
    logger.info('✅ Database disconnected successfully')
  } catch (error) {
    logger.error('❌ Database disconnection failed:', error)
    throw error
  }
}

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error('❌ Database health check failed:', error)
    return false
  }
}

// Database transaction helper
export const transaction = prisma.$transaction

// Database utilities
export const dbUtils = {
  // Reset database (use with caution!)
  resetDatabase: async (): Promise<void> => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset database in production')
    }

    logger.warn('⚠️  Resetting database...')
    
    // Get all table names
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `

    // Disable foreign key checks
    await prisma.$executeRaw`SET session_replication_role = replica;`

    // Truncate all tables
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table.tablename}" CASCADE;`)
    }

    // Re-enable foreign key checks
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`

    logger.info('✅ Database reset completed')
  },

  // Get database statistics
  getDatabaseStats: async () => {
    const stats = await prisma.$queryRaw<Array<{
      table_name: string
      row_count: number
      size_bytes: number
    }>>`
      SELECT 
        schemaname as schema_name,
        tablename as table_name,
        n_tup_ins + n_tup_upd + n_tup_del as row_count,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
    `

    return stats
  },

  // Check for pending migrations
  checkMigrations: async (): Promise<boolean> => {
    try {
      const result = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name FROM "_prisma_migrations" 
        WHERE finished_at IS NULL
      `
      return result.length === 0
    } catch (error) {
      logger.error('Error checking migrations:', error)
      return false
    }
  },

  // Backup database (PostgreSQL specific)
  createBackup: async (backupPath: string): Promise<void> => {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined')
    }

    const command = `pg_dump "${databaseUrl}" > "${backupPath}"`
    
    try {
      await execAsync(command)
      logger.info(`✅ Database backup created: ${backupPath}`)
    } catch (error) {
      logger.error('❌ Database backup failed:', error)
      throw error
    }
  },
}

// Middleware for database operations
export const withTransaction = async <T>(
  operation: (tx: typeof prisma) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(async (tx) => {
    return await operation(tx)
  })
}

// Database event listeners
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_QUERIES === 'true') {
    logger.debug(`Query: ${e.query}`)
    logger.debug(`Params: ${e.params}`)
    logger.debug(`Duration: ${e.duration}ms`)
  }
})

prisma.$on('info', (e) => {
  logger.info(`Prisma Info: ${e.message}`)
})

prisma.$on('warn', (e) => {
  logger.warn(`Prisma Warning: ${e.message}`)
})

prisma.$on('error', (e) => {
  logger.error(`Prisma Error: ${e.message}`)
})

export default prisma