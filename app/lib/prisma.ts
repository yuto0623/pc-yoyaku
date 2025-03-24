import { PrismaClient } from "@prisma/client";

// PrismaClientをグローバルに宣言して、ホットリロードで複数インスタンスが作成されるのを防ぐ
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
