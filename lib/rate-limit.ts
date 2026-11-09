const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000;

const requests = new Map<string, number[]>();

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

export function checkRateLimit(
  userId: string
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const recentRequests = (
    requests.get(userId) ?? []
  ).filter((timestamp) => timestamp > windowStart);

  if (recentRequests.length >= RATE_LIMIT) {
    const retryAfter = Math.max(
      1,
      Math.ceil(
        (recentRequests[0] + WINDOW_MS - now) / 1000
      )
    );

    requests.set(userId, recentRequests);

    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    };
  }

  recentRequests.push(now);
  requests.set(userId, recentRequests);

  return {
    allowed: true,
    remaining: RATE_LIMIT - recentRequests.length,
    retryAfter: 0,
  };
}