import { env } from '@/lib/env';
import { Ratelimit, type RatelimitConfig } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only create Redis instance if credentials are available
let redis: Redis | null = null;

try {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn('Failed to initialize Redis for rate limiting:', error);
}

export { redis };

export const createRateLimiter = (props: Omit<RatelimitConfig, 'redis'>) => {
  if (!redis) {
    // Return a no-op rate limiter if Redis is not available
    return {
      limit: async () => ({
        success: true,
        limit: 0,
        remaining: 0,
        reset: 0,
        pending: Promise.resolve(),
      }),
    };
  }

  return new Ratelimit({
    redis,
    limiter: props.limiter ?? Ratelimit.slidingWindow(10, '10 s'),
    prefix: props.prefix ?? 'next-forge',
  });
};

export const { slidingWindow } = Ratelimit;
