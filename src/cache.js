const LZUTF8 = require('lzutf8');
const NodeCache = require('node-cache');
const copy = require('fast-copy').default;
const { isDefined } = require('./utils');

const cacheTimeInSecs = 60 * 10; // 10 min
const checkIntervalInSecs = 60 * 1; // 1 min

/**
 * Cache service for functions groups per uri
 */
class CacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: cacheTimeInSecs,
      checkperiod: checkIntervalInSecs,
      useClones: false
    });
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
    const { functionGroups } = this.cache.get(uri);

    if (isDefined(functionGroups)) {
      // If key exists, refresh TTL
      this.cache.ttl(uri, cacheTimeInSecs);
      return copy(functionGroups);
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
