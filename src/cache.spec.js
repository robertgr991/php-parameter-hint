const { describe, it } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const { CacheService } = require('./cache');

describe('CacheService', () => {
  describe('set, get and delete', () => {
    it('should correctly execute all the operations', async () => {
      const cacheService = new CacheService();
      const uri = 'uri';
      const text = 'text';
      const functionGroups = [1, 2, 3];
      await cacheService.setFunctionGroups(uri, text, functionGroups);
      let retrievedFunctionGroups = cacheService.getFunctionGroups(uri);
      // Function groups are deep copied so it's not the same reference
      expect(retrievedFunctionGroups).to.not.equal(functionGroups);
      expect(retrievedFunctionGroups).to.deep.equal(functionGroups);
      cacheService.deleteFunctionGroups(uri);
      retrievedFunctionGroups = cacheService.getFunctionGroups(uri);
      expect(retrievedFunctionGroups).to.have.lengthOf(0);
    });
  });
  describe('TTL expire', () => {
    const clock = sinon.useFakeTimers({
      shouldAdvanceTime: true
    });
    after(() => {
      clock.restore();
    });
    it('should return empty array if TTL has expired', async () => {
      const ttlSeconds = 1;
      const expireCheckSeconds = 1;
      const cacheService = new CacheService(ttlSeconds, expireCheckSeconds);
      const uri = 'uri';
      const text = 'text';
      const functionGroups = [1, 2, 3];
      await cacheService.setFunctionGroups(uri, text, functionGroups);

      // wait for cache to be deleted
      clock.tick(3000); // sinon uses milliseconds so 3 seconds
      const retrievedFunctionGroups = cacheService.getFunctionGroups(uri);
      expect(retrievedFunctionGroups).to.have.lengthOf(0);
    });
  });
  describe('check valid cached text', () => {
    it('should return true only if the text is the same as the cached text', async () => {
      const cacheService = new CacheService();
      const uri = 'uri';
      const text = 'text';
      const functionGroups = [1, 2, 3];
      await cacheService.setFunctionGroups(uri, text, functionGroups);
      // Successful retrieval
      let isValid = await cacheService.isCachedTextValid(uri, text);
      expect(isValid).to.be.true;
      // With different text
      const newText = 'text2';
      isValid = await cacheService.isCachedTextValid(uri, newText);
      expect(isValid).to.be.false;
      // After cache is deleted
      cacheService.deleteFunctionGroups(uri);
      isValid = await cacheService.isCachedTextValid(uri, text);
      expect(isValid).to.be.false;
    });
  });
  describe('remove all cached data', () => {
    it('should return all existing cached data', async () => {
      const cacheService = new CacheService();
      const uri1 = 'uri1';
      const text1 = 'text1';
      const uri2 = 'uri2';
      const text2 = 'text2';
      const functionGroups = [1, 2, 3];
      await cacheService.setFunctionGroups(uri1, text1, functionGroups);
      await cacheService.setFunctionGroups(uri2, text2, functionGroups);
      cacheService.removeAll();
      const retrievedFunctionGroups1 = cacheService.getFunctionGroups(uri1);
      expect(retrievedFunctionGroups1).to.have.lengthOf(0);
      const retrievedFunctionGroups2 = cacheService.getFunctionGroups(uri2);
      expect(retrievedFunctionGroups2).to.have.lengthOf(0);
    });
  });
});
