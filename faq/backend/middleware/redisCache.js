const { createClient } = require('redis');

let redisClient;

(async () => {
  if (process.env.REDIS_URL) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    await redisClient.connect();
    console.log('✅ Redis Connected');
  }
})();

const cacheMiddleware = (keyPrefix) => {
  return async (req, res, next) => {
    if (!redisClient) return next();

    const key = `${keyPrefix}:${req.originalUrl}`;
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
      
      // Override res.json to cache the response before sending
      const originalJson = res.json;
      res.json = function (data) {
        redisClient.setEx(key, 3600, JSON.stringify(data)); // Cache for 1 hour
        originalJson.call(this, data);
      };
      next();
    } catch (err) {
      console.error('Redis cache error:', err);
      next();
    }
  };
};

const clearCache = async (keyPattern) => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(keyPattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error('Redis clear cache error:', err);
  }
}

module.exports = { cacheMiddleware, clearCache, redisClient };
