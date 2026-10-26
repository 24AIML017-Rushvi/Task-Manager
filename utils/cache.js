const NodeCache = require('node-cache');

/**
 * Shared In-Memory Cache Module (Practical 9)
 *
 * Implements in-memory caching using NodeCache with:
 * - 60-second default TTL (Time-To-Live)
 * - Automatic background expiration check every 120 seconds
 * - Custom cache-hit and cache-miss counters
 * - User-scoped and item-scoped cache invalidation helpers
 */

// Initialize NodeCache with 60s TTL
const nodeCache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: true
});

// Cache hit and miss counters
let hitCount = 0;
let missCount = 0;

/**
 * Retrieve an item from the cache.
 * Automatically updates hit / miss counters.
 */
function get(key) {
  const value = nodeCache.get(key);
  if (value !== undefined) {
    hitCount++;
    return value;
  }
  missCount++;
  return undefined;
}

/**
 * Store an item in the cache.
 * @param {string} key
 * @param {any} value
 * @param {number} [ttl=60] TTL in seconds
 */
function set(key, value, ttl = 60) {
  return nodeCache.set(key, value, ttl);
}

/**
 * Delete a specific key from the cache.
 */
function del(key) {
  return nodeCache.del(key);
}

/**
 * Delete multiple keys from the cache.
 */
function delKeys(keys) {
  return nodeCache.del(keys);
}

/**
 * Invalidate all cached task queries for a specific user and global admin caches.
 * Called on task creation, update, or deletion.
 */
function invalidateUserTasks(userId) {
  const allKeys = nodeCache.keys();
  const keysToDelete = allKeys.filter((k) =>
    (userId && k.startsWith(`tasks:user:${userId}`)) ||
    k.startsWith('tasks:admin') ||
    k.startsWith('tasks:reports')
  );

  if (keysToDelete.length > 0) {
    nodeCache.del(keysToDelete);
  }
  return keysToDelete;
}

/**
 * Invalidate a specific task item cache and related task query lists.
 */
function invalidateTask(taskId, userId) {
  const allKeys = nodeCache.keys();
  const keysToDelete = allKeys.filter((k) =>
    k === `task:${taskId}` ||
    (userId && k.startsWith(`tasks:user:${userId}`)) ||
    k.startsWith('tasks:admin') ||
    k.startsWith('tasks:reports')
  );

  if (keysToDelete.length > 0) {
    nodeCache.del(keysToDelete);
  }
  return keysToDelete;
}

/**
 * Return comprehensive cache statistics including hit/miss counts and ratios.
 */
function getStats() {
  const total = hitCount + missCount;
  const ratio = total > 0 ? `${((hitCount / total) * 100).toFixed(2)}%` : '0.00%';
  const allKeys = nodeCache.keys();

  return {
    hits: hitCount,
    misses: missCount,
    totalRequests: total,
    hitRatio: ratio,
    stdTTL: 60,
    keysCount: allKeys.length,
    activeKeys: allKeys,
    nodeCacheStats: nodeCache.getStats()
  };
}

/**
 * Reset all cached data and zero out hit/miss counters.
 */
function flush() {
  hitCount = 0;
  missCount = 0;
  nodeCache.flushAll();
}

module.exports = {
  cache: nodeCache,
  get,
  set,
  del,
  delKeys,
  invalidateUserTasks,
  invalidateTask,
  getStats,
  flush
};
