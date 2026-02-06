import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

function getPrismaClient() {
  if (!globalForPrisma.pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // During build, DATABASE_URL might not be available
      // Return a dummy client that will error on actual queries
      return new PrismaClient();
    }
    globalForPrisma.pool = new pg.Pool({ connectionString });
  }

  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg(globalForPrisma.pool);
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();
