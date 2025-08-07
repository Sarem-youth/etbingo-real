import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Initialize database with default data if needed
export async function initializeDatabase() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`
    
    // Check if we need to create default stake levels
    const stakeLevelsCount = await db.stakeLevel.count()
    if (stakeLevelsCount === 0) {
      await db.stakeLevel.createMany({
        data: [
          { amount: 10, isActive: true },
          { amount: 20, isActive: true },
          { amount: 50, isActive: true },
          { amount: 100, isActive: true },
          { amount: 200, isActive: true },
          { amount: 300, isActive: true },
        ],
      })
    }
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
    // Don't throw the error, allow the app to continue
  }
}