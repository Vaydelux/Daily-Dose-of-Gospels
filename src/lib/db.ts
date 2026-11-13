import { PrismaClient } from '@prisma/client'
import { createDummyDb } from './dummy-db'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function isDummyMode(): boolean {
  if (process.env.USE_DUMMY_DATA === 'true') return true
  const url = process.env.DATABASE_URL?.trim()
  if (!url) return true
  if (url.includes('user:password@host:5432')) return true
  return false
}

export const db =
  globalForPrisma.prisma ??
  (isDummyMode() ? createDummyDb() : new PrismaClient())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
