#!/usr/bin/env npx ts-node
import { prisma } from '../config/database-simple'

async function createTestUser() {
  try {
    console.log('Creating test user...')

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.id)
      return existingUser
    }

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'mock-password-hash',
        role: 'EDUCATOR',
        // Add subscription
        subscription: {
          create: {
            plan: 'PRO',
            status: 'ACTIVE',
          }
        }
      },
      include: {
        subscription: true
      }
    })

    console.log('✅ Test user created successfully!')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Subscription: ${user.subscription?.plan} (${user.subscription?.status})`)
    
    return user
  } catch (error) {
    console.error('❌ Error creating test user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  createTestUser()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}