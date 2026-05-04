import Redis from 'ioredis';
import config from '../config';

const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 1,
  retryStrategy: (times: number) => (times > 3 ? null : 1000), // Fail fast if Redis is down
});

let redisErrorLogged = false;
redis.on('error', (err: Error) => {
  if (!redisErrorLogged) {
    console.warn('Redis Connection Error (Check if Redis is running):', err.message);
    redisErrorLogged = true;
  }
});
redis.on('connect', () => {
  console.log('✅ Connected to Redis successfully');
  redisErrorLogged = false;
});

export default redis;
