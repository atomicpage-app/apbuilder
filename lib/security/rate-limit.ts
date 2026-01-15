// lib/security/rate-limit.ts

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const WINDOW_SECONDS = 15 * 60;

type LimitResult =
  | { allowed: true }
  | { allowed: false; dimension: "ip" | "email" };

async function check(
  key: string,
  limit: number
): Promise<boolean> {
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  return count <= limit;
}

export async function rateLimitResend(
  ipHash: string,
  emailHash: string
): Promise<LimitResult> {
  try {
    const ipKey = `rl:resend:ip:${ipHash}`;
    const emailKey = `rl:resend:email:${emailHash}`;

    const ipAllowed = await check(ipKey, 5);
    if (!ipAllowed) {
      return { allowed: false, dimension: "ip" };
    }

    const emailAllowed = await check(emailKey, 3);
    if (!emailAllowed) {
      return { allowed: false, dimension: "email" };
    }

    return { allowed: true };
  } catch {
    // Fail-open
    return { allowed: true };
  }
}
