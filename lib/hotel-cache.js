const cache = new Map();

function makeKey(params) {
  return JSON.stringify(params);
}

export function getCachedSearch(params) {
  const key = makeKey(params);
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

export function setCachedSearch(params, value, ttlMs = 10 * 60 * 1000) {
  const key = makeKey(params);
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}