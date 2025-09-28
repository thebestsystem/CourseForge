#!/usr/bin/env npx ts-node
import { prisma } from '../config/database-simple'

async function clearUserSettings() {
  try {
    console.log('Clearing corrupted user settings...')

    const result = await prisma.userSettings.deleteMany({
      where: {
        userId: 'cmg3xt3pe0000obf7tgelmjnq'
      }
    })

    console.log(`✅ Deleted ${result.count} user settings records`)
  } catch (error) {
    console.error('❌ Error clearing settings:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  clearUserSettings()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}