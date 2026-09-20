import { Prisma } from "@prisma/client";
import { uuidv7 } from "uuidv7";
import { prisma } from "./prisma.js";

/**
 * Persistence for client-supplied Idempotency-Key records (API.md §7, Decision #40).
 * Postgres only, never Redis (#10). Records expire after 24 hours.
 */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export type IdempotencyRecord = {
  id: string;
  paramsHash: string;
  statusCode: number | null;
  responseBody: unknown;
};

/** Claims the key. Returns null when it was claimed now, or the existing record. */
export async function claimIdempotencyKey(input: {
  userId: string;
  key: string;
  method: string;
  path: string;
  paramsHash: string;
}): Promise<IdempotencyRecord | null> {
  try {
    await prisma.idempotencyKey.create({
      data: {
        id: uuidv7(),
        ...input,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      },
    });
    return null;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.idempotencyKey.findUnique({
        where: { userId_key: { userId: input.userId, key: input.key } },
      });
      if (existing && existing.expiresAt.getTime() <= Date.now()) {
        await prisma.idempotencyKey.delete({ where: { id: existing.id } });
        return claimIdempotencyKey(input);
      }
      return existing;
    }
    throw err;
  }
}

export async function completeIdempotencyKey(
  userId: string,
  key: string,
  statusCode: number,
  responseBody: unknown
): Promise<void> {
  await prisma.idempotencyKey.update({
    where: { userId_key: { userId, key } },
    data: { statusCode, responseBody: responseBody as Prisma.InputJsonValue },
  });
}

export async function releaseIdempotencyKey(userId: string, key: string): Promise<void> {
  await prisma.idempotencyKey.deleteMany({ where: { userId, key, statusCode: null } });
}
