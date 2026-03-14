import { PrismaClient } from '@prisma/client'

export type UserMethods = {
  findUnique?: (args: any) => Promise<any>
  create?: (args: any) => Promise<any>
  upsert?: (args: any) => Promise<any>
}

export function makeMockPrisma(userMethods: UserMethods = {}): PrismaClient {
  return {
    user: {
      findUnique: userMethods.findUnique ?? (async () => null),
      create: userMethods.create ?? (async (args: any) => ({ id: 'mock-id', ...args.data })),
      upsert: userMethods.upsert ?? (async (args: any) => ({ id: 'mock-id', ...args.create })),
    },
    $connect: async () => {},
    $disconnect: async () => {},
  } as unknown as PrismaClient
}
