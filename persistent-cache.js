// Persistent file-based cache system for Wikidata API responses
// Stores cached responses in /data folder for persistence across test runs

import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

/**
 * Persistent File-Based Cache Manager
 * Stores API responses in JSON files in the /data directory
 */
class PersistentCacheManager {
  constructor(cacheDir = './data') {
    this.cacheDir = cacheDir;
    this.memoryCache = new Map(); // In-memory cache for faster access
    this.maxMemorySize = 1000; // Maximum items in memory cache
    this.ensureCacheDir();
  }

  /**
   * Ensure cache directory exists
   */
  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create cache directory:', error.message);
    }
  }

  /**
   * Generate cache key from query parameters
   */
  generateCacheKey(query, languages = 'en', limit = 50, type = 'both') {
    const keyString = `${query}|${languages}|${limit}|${type}`;
    return createHash('md5').update(keyString).digest('hex');
  }

  /**
   * Get cache file path for a given key
   */
  getCacheFilePath(key) {
    return path.join(this.cacheDir, `${key}.json`);
  }

  /**
   * Get cached response
   */
  async get(query, languages = 'en', limit = 50, type = 'both') {
    const key = this.generateCacheKey(query, languages, limit, type);
    
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (this.isCacheValid(cached)) {
        return cached.data;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // Check file cache
    try {
      const filePath = this.getCacheFilePath(key);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const cached = JSON.parse(fileContent);
      
      if (this.isCacheValid(cached)) {
        // Add to memory cache
        this.addToMemoryCache(key, cached);
        return cached.data;
      } else {
        // Remove expired cache file
        await this.delete(key);
        return null;
      }
    } catch (error) {
      // Cache file doesn't exist or is corrupted
      return null;
    }
  }

  /**
   * Store response in cache
   */
  async set(query, data, languages = 'en', limit = 50, type = 'both', ttl = 24 * 60 * 60 * 1000) {
    const key = this.generateCacheKey(query, languages, limit, type);
    const cacheEntry = {
      data: data,
      timestamp: Date.now(),
      ttl: ttl,
      query: query,
      languages: languages,
      limit: limit,
      type: type
    };

    // Store in memory cache
    this.addToMemoryCache(key, cacheEntry);

    // Store in file cache
    try {
      const filePath = this.getCacheFilePath(key);
      await fs.writeFile(filePath, JSON.stringify(cacheEntry, null, 2));
    } catch (error) {
      console.warn('Failed to write cache file:', error.message);
    }
  }

  /**
   * Add entry to memory cache with size management
   */
  addToMemoryCache(key, entry) {
    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, entry);
  }

  /**
   * Check if cache entry is still valid
   */
  isCacheValid(cached) {
    if (!cached || !cached.timestamp || !cached.ttl) {
      return false;
    }
    
    return Date.now() - cached.timestamp < cached.ttl;
  }

  /**
   * Delete cached entry
   */
  async delete(query, languages = 'en', limit = 50, type = 'both') {
    const key = this.generateCacheKey(query, languages, limit, type);
    
    // Remove from memory cache
    this.memoryCache.delete(key);
    
    // Remove from file cache
    try {
      const filePath = this.getCacheFilePath(key);
      await fs.unlink(filePath);
    } catch (error) {
      // File doesn't exist or can't be deleted
    }
  }

  /**
   * Clear all cache (memory and files)
   */
  async clear() {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear file cache
    try {
      const files = await fs.readdir(this.cacheDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      await Promise.all(
        jsonFiles.map(file => 
          fs.unlink(path.join(this.cacheDir, file)).catch(() => {})
        )
      );
    } catch (error) {
      console.warn('Failed to clear cache directory:', error.message);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const memorySize = this.memoryCache.size;
    
    let fileCount = 0;
    let totalFileSize = 0;
    let oldestFile = null;
    let newestFile = null;
    
    try {
      const files = await fs.readdir(this.cacheDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      fileCount = jsonFiles.length;
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.cacheDir, file);
          const stats = await fs.stat(filePath);
          totalFileSize += stats.size;
          
          if (!oldestFile || stats.mtime < oldestFile.mtime) {
            oldestFile = { file, mtime: stats.mtime };
          }
          if (!newestFile || stats.mtime > newestFile.mtime) {
            newestFile = { file, mtime: stats.mtime };
          }
        } catch (error) {
          // Skip corrupted files
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    
    return {
      memoryCache: {
        size: memorySize,
        maxSize: this.maxMemorySize
      },
      fileCache: {
        fileCount: fileCount,
        totalSizeBytes: totalFileSize,
        totalSizeMB: (totalFileSize / (1024 * 1024)).toFixed(2),
        oldestFile: oldestFile ? {
          name: oldestFile.file,
          age: Date.now() - oldestFile.mtime.getTime()
        } : null,
        newestFile: newestFile ? {
          name: newestFile.file,
          age: Date.now() - newestFile.mtime.getTime()
        } : null
      }
    };
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpired() {
    let cleanedCount = 0;
    
    // Clean memory cache
    for (const [key, entry] of this.memoryCache) {
      if (!this.isCacheValid(entry)) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }
    
    // Clean file cache
    try {
      const files = await fs.readdir(this.cacheDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.cacheDir, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const cached = JSON.parse(fileContent);
          
          if (!this.isCacheValid(cached)) {
            await fs.unlink(filePath);
            cleanedCount++;
          }
        } catch (error) {
          // Remove corrupted files
          try {
            await fs.unlink(path.join(this.cacheDir, file));
            cleanedCount++;
          } catch (deleteError) {
            // Ignore deletion errors
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clean expired cache:', error.message);
    }
    
    return cleanedCount;
  }

  /**
   * Pre-populate cache with common queries
   */
  async prePopulate(commonQueries = []) {
    console.log(`Pre-populating cache with ${commonQueries.length} queries...`);
    
    for (const query of commonQueries) {
      const cached = await this.get(query);
      if (!cached) {
        console.log(`  Need to fetch: ${query}`);
        // This would need to be called with actual API client
        // For now, just log what needs to be fetched
      } else {
        console.log(`  Already cached: ${query}`);
      }
    }
  }

  /**
   * Export cache data for backup
   */
  async exportCache() {
    const allEntries = {};
    
    try {
      const files = await fs.readdir(this.cacheDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.cacheDir, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const cached = JSON.parse(fileContent);
          
          if (this.isCacheValid(cached)) {
            allEntries[cached.query] = cached;
          }
        } catch (error) {
          // Skip corrupted files
        }
      }
    } catch (error) {
      console.warn('Failed to export cache:', error.message);
    }
    
    return allEntries;
  }

  /**
   * Import cache data from backup
   */
  async importCache(cacheData) {
    let importedCount = 0;
    
    for (const [query, entry] of Object.entries(cacheData)) {
      try {
        await this.set(
          query, 
          entry.data, 
          entry.languages || 'en', 
          entry.limit || 50, 
          entry.type || 'both',
          entry.ttl || 24 * 60 * 60 * 1000
        );
        importedCount++;
      } catch (error) {
        console.warn(`Failed to import cache entry for "${query}":`, error.message);
      }
    }
    
    return importedCount;
  }
}

export { PersistentCacheManager };