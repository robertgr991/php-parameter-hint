const LZUTF8 = require('lzutf8');
const NodeCache = require('node-cache');
const { isDefined, getCopyFunc } = require('./utils');

const copy = getCopyFunc();

/**
 * Cache service for functions groups per uri
 */
class CacheService {
  constructor(cacheTimeInSecs = 60 * 10, checkIntervalInSecs = 60 * 1) {
    this.cacheTimeInSecs = cacheTimeInSecs;
    this.cache = new NodeCache({
      stdTTL: cacheTimeInSecs,
      checkperiod: checkIntervalInSecs,
      useClones: false
    });
  }

  // Remove all cached data
  removeAll() {
    this.cache.flushAll();
  }

  /**
   * Cache the function groups per uri
   *
   * @param {string} uri
   * @param {string} text
   * @param {array} functionGroups
   */
  setFunctionGroups(uri, text, functionGroups) {
    return new Promise(resolve => {
      LZUTF8.compressAsync(text, undefined, (result, error) => {
        if (isDefined(error) || !isDefined(result)) {
          // Fail silently without adding the data to cache
          resolve();
          return;
        }

        const data = {
          compressedText: result,
          // @ts-ignore
          functionGroups: copy(functionGroups)
        };
        this.cache.set(uri, data);
        resolve();
      });
    });
  }

  /**
   *
   * @param {string} uri
   */
  getFunctionGroups(uri) {
    const cachedData = this.cache.get(uri);

    if (isDefined(cachedData) && isDefined(cachedData.functionGroups)) {
      // If key exists, refresh TTL
      this.cache.ttl(uri, this.cacheTimeInSecs);
      // @ts-ignore
      return copy(cachedData.functionGroups);
    }

    return [];
  }

  /**
   *
   * @param {string} uri
   */
  deleteFunctionGroups(uri) {
    this.cache.del(uri);
  }

  /**
   * Check if text from uri is the same as the cached text
   * @param {string} uri
   * @param {string} text
   */
  isCachedTextValid(uri, text) {
    return new Promise(resolve => {
      if (!this.cache.has(uri)) {
        resolve(false);
        return;
      }

      const { compressedText } = this.cache.get(uri);

      if (!isDefined(compressedText)) {
        resolve(false);
        return;
      }

      LZUTF8.decompressAsync(compressedText, undefined, (cachedText, error) => {
        if (isDefined(error) || !isDefined(cachedText)) {
          resolve(false);
          return;
        }

        if (text !== cachedText) {
          resolve(false);
          return;
        }

        resolve(true);
      });
    });
  }
}

module.exports = {
  CacheService
};
