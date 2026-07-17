import { prisma } from "@/lib/prisma";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

export type LoginBlockResult =
  | { blocked: false; attempts: number }
  | { blocked: true; retryAfterSeconds: number; attempts: number };

export async function getLoginBlockStatus(
  userId: string
): Promise<LoginBlockResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true, failedLoginAttempts: true },
  });

  if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const retryAfterSeconds = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 1000
    );
    return { blocked: true, retryAfterSeconds, attempts: MAX_FAILED_ATTEMPTS };
  }

  return { blocked: false, attempts: user?.failedLoginAttempts ?? 0 };
}

export async function registerFailedLogin(userId: string): Promise<LoginBlockResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  });

  const attempts = (user?.failedLoginAttempts ?? 0) + 1;

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: attempts, lockedUntil },
    });
    return { blocked: true, retryAfterSeconds: LOCK_DURATION_MS / 1000, attempts };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: attempts },
  });

  return { blocked: false, attempts };
}

export async function clearFailedLogins(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}
