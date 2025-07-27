// Unified Cache System - supports both file-based (Node.js) and IndexedDB (Browser) caching
// Provides a common interface for caching with interchangeable backends

import { PersistentCacheManager } from './persistent-cache.js';

/**
 * Cache Interface - defines the standard cache API
 */
class CacheInterface {
  /**
   * Get cached data
   * @param {string} key - Cache key
   * @param {string} languages - Language parameter
   * @param {number} limit - Limit parameter  
   * @param {string} type - Type parameter
   * @returns {Promise<any>} - Cached data or null
   */
  async get(key, languages = 'en', limit = 50, type = 'both') {
    throw new Error('get() method must be implemented');
  }

  /**
   * Set cached data
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {string} languages - Language parameter
   * @param {number} limit - Limit parameter
   * @param {string} type - Type parameter
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<void>}
   */
  async set(key, data, languages = 'en', limit = 50, type = 'both', ttl = 24 * 60 * 60 * 1000) {
    throw new Error('set() method must be implemented');
  }

  /**
   * Delete cached data
   * @param {string} key - Cache key
   * @param {string} languages - Language parameter
   * @param {number} limit - Limit parameter
   * @param {string} type - Type parameter
   * @returns {Promise<void>}
   */
  async delete(key, languages = 'en', limit = 50, type = 'both') {
    throw new Error('delete() method must be implemented');
  }

  /**
   * Clear all cached data
   * @returns {Promise<void>}
   */
  async clear() {
    throw new Error('clear() method must be implemented');
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache statistics
   */
  async getStats() {
    throw new Error('getStats() method must be implemented');
  }
}

/**
 * File-based Cache Adapter (Node.js environments)
 */
class FileCacheAdapter extends CacheInterface {
  constructor(cacheDir = './data/wikidata-cache') {
    super();
    this.cache = new PersistentCacheManager(cacheDir);
  }

  async get(key, languages = 'en', limit = 50, type = 'both') {
    return await this.cache.get(key, languages, limit, type);
  }

  async set(key, data, languages = 'en', limit = 50, type = 'both', ttl = 24 * 60 * 60 * 1000) {
    return await this.cache.set(key, data, languages, limit, type, ttl);
  }

  async delete(key, languages = 'en', limit = 50, type = 'both') {
    return await this.cache.delete(key, languages, limit, type);
  }

  async clear() {
    return await this.cache.clear();
  }

  async getStats() {
    return await this.cache.getStats();
  }
}

/**
 * IndexedDB Cache Adapter (Browser environments)
 * Compatible with existing WikidataCacheManager structure
 */
class IndexedDBCacheAdapter extends CacheInterface {
  constructor(dbName = 'WikidataSearchCache', version = 1) {
    super();
    this.dbName = dbName;
    this.version = version;
    this.storeName = 'searchResults';
    this.memoryCache = new Map();
    this.maxMemorySize = 1000;
  }

  /**
   * Initialize IndexedDB
   */
  async initDB() {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB not available in this environment');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'cacheKey' });
        }
      };
    });
  }

  /**
   * Generate cache key consistent with file cache
   */
  generateCacheKey(key, languages = 'en', limit = 50, type = 'both') {
    const keyString = `${key}|${languages}|${limit}|${type}`;
    // Simple hash function for browser compatibility
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  async get(key, languages = 'en', limit = 50, type = 'both') {
    const cacheKey = this.generateCacheKey(key, languages, limit, type);
    
    // Check memory cache first
    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        return cached.data;
      } else {
        this.memoryCache.delete(cacheKey);
      }
    }

    // Check IndexedDB
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(cacheKey);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          if (result && this.isCacheValid(result)) {
            // Add to memory cache
            this.addToMemoryCache(cacheKey, result);
            resolve(result.data);
          } else {
            if (result) {
              // Remove expired entry
              this.delete(key, languages, limit, type);
            }
            resolve(null);
          }
        };
      });
    } catch (error) {
      console.warn('IndexedDB cache read error:', error);
      return null;
    }
  }

  async set(key, data, languages = 'en', limit = 50, type = 'both', ttl = 24 * 60 * 60 * 1000) {
    const cacheKey = this.generateCacheKey(key, languages, limit, type);
    const cacheEntry = {
      cacheKey: cacheKey,
      data: data,
      timestamp: Date.now(),
      ttl: ttl,
      originalKey: key,
      languages: languages,
      limit: limit,
      type: type
    };

    // Add to memory cache
    this.addToMemoryCache(cacheKey, cacheEntry);

    // Add to IndexedDB
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(cacheEntry);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IndexedDB cache write error:', error);
    }
  }

  async delete(key, languages = 'en', limit = 50, type = 'both') {
    const cacheKey = this.generateCacheKey(key, languages, limit, type);
    
    // Remove from memory cache
    this.memoryCache.delete(cacheKey);
    
    // Remove from IndexedDB
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(cacheKey);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IndexedDB cache delete error:', error);
    }
  }

  async clear() {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear IndexedDB
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IndexedDB cache clear error:', error);
    }
  }

  async getStats() {
    const memorySize = this.memoryCache.size;
    let dbSize = 0;
    let oldestEntry = null;
    let newestEntry = null;

    try {
      const db = await this.initDB();
      
      dbSize = await new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.count();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      // Get oldest and newest entries
      const allEntries = await new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      if (allEntries.length > 0) {
        const sortedEntries = allEntries.sort((a, b) => a.timestamp - b.timestamp);
        oldestEntry = {
          key: sortedEntries[0].originalKey,
          age: Date.now() - sortedEntries[0].timestamp
        };
        newestEntry = {
          key: sortedEntries[sortedEntries.length - 1].originalKey,
          age: Date.now() - sortedEntries[sortedEntries.length - 1].timestamp
        };
      }

    } catch (error) {
      console.warn('Error getting IndexedDB stats:', error);
    }

    return {
      memoryCache: {
        size: memorySize,
        maxSize: this.maxMemorySize
      },
      dbCache: {
        size: dbSize,
        type: 'IndexedDB',
        oldestEntry: oldestEntry,
        newestEntry: newestEntry
      }
    };
  }

  /**
   * Check if cache entry is valid
   */
  isCacheValid(cached) {
    if (!cached || !cached.timestamp || !cached.ttl) {
      return false;
    }
    return Date.now() - cached.timestamp < cached.ttl;
  }

  /**
   * Add entry to memory cache with size management
   */
  addToMemoryCache(key, entry) {
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, entry);
  }
}

/**
 * No-op Cache Adapter (disable caching)
 */
class NoCacheAdapter extends CacheInterface {
  async get() { return null; }
  async set() { return; }
  async delete() { return; }
  async clear() { return; }
  async getStats() {
    return {
      memoryCache: { size: 0, maxSize: 0 },
      dbCache: { size: 0, type: 'disabled' }
    };
  }
}

/**
 * Cache Factory - creates appropriate cache based on environment
 */
class CacheFactory {
  /**
   * Create cache instance based on type and environment
   * @param {string} type - 'auto', 'file', 'indexeddb', or 'none'
   * @param {Object} options - Cache configuration options
   * @returns {CacheInterface} - Cache instance
   */
  static create(type = 'auto', options = {}) {
    switch (type) {
      case 'file':
        return new FileCacheAdapter(options.cacheDir);
        
      case 'indexeddb':
        return new IndexedDBCacheAdapter(options.dbName, options.version);
        
      case 'none':
        return new NoCacheAdapter();
        
      case 'auto':
      default:
        // Auto-detect environment
        if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
          // Browser environment
          console.log('Auto-detected browser environment, using IndexedDB cache');
          return new IndexedDBCacheAdapter(options.dbName, options.version);
        } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          // Node.js environment
          console.log('Auto-detected Node.js environment, using file cache');
          return new FileCacheAdapter(options.cacheDir);
        } else {
          // Unknown environment, disable caching
          console.log('Unknown environment, disabling cache');
          return new NoCacheAdapter();
        }
    }
  }
}

export { 
  CacheInterface, 
  FileCacheAdapter, 
  IndexedDBCacheAdapter, 
  NoCacheAdapter, 
  CacheFactory 
};