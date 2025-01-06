import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type GlobalWithPrisma = typeof globalThis & {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
};

const globalWithPrisma = globalThis as GlobalWithPrisma;

const prisma = globalWithPrisma.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production")
  globalWithPrisma.prismaGlobal = prisma;
