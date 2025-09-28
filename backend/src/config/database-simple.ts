import { PrismaClient } from '@prisma/client'

// Create a simple Prisma client instance
export const prisma = new PrismaClient({
  log: ['error'], // Minimal logging to avoid issues
})