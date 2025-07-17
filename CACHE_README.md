# Wikidata Viewer Caching System

This document describes the IndexedDB caching system implemented for the Wikidata Viewer application.

## Overview

The caching system uses IndexedDB to store Wikidata entity and property data locally, reducing API calls and improving performance. The cache is automatically managed with a 24-hour expiration time.

## Files

- `cache.js` - Main caching utilities
- `properties.html` - Updated to use cached property data
- `entities.html` - Updated to use cached entity data

## Cache Configuration

```javascript
const CACHE_CONFIG = {
  dbName: 'WikidataCache',
  dbVersion: 1,
  stores: {
    entities: 'entities',
    properties: 'properties'
  },
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};
```

## Available Functions

### Core Functions

- `fetchEntityData(entityId, languages)` - Fetch entity data with caching
- `fetchPropertyData(propertyId, languages)` - Fetch property data with caching
- `fetchMultipleLabels(ids, languages)` - Fetch multiple labels with caching

### Cache Management

- `getFromCache(storeName, id)` - Get data from cache
- `saveToCache(storeName, id, data)` - Save data to cache
- `clearExpiredCache()` - Remove expired cache entries
- `clearAllCache()` - Clear all cached data
- `getCacheStats()` - Get cache statistics

## Usage

### In HTML Files

Include the cache.js script before your main application code:

```html
<script src="cache.js"></script>
```

### Fetching Data

```javascript
// Fetch entity data
const entityData = await WikidataCache.fetchEntityData('Q35120', 'en|fr|de');

// Fetch property data
const propertyData = await WikidataCache.fetchPropertyData('P31', 'en|fr|de');

// Fetch multiple labels
const labels = await WikidataCache.fetchMultipleLabels(['P31', 'Q35120'], 'en|fr|de');
```

## Cache Behavior

1. **Cache First**: The system always checks the cache before making API calls
2. **Automatic Expiration**: Cache entries expire after 24 hours
3. **Automatic Cleanup**: Expired entries are removed when pages load
4. **Fallback**: If cache fails, the system falls back to direct API calls

## Performance Benefits

- **Reduced API Calls**: Frequently accessed data is served from cache
- **Faster Loading**: Cached data loads instantly
- **Bandwidth Savings**: Reduces data transfer for repeated requests
- **Offline Support**: Cached data is available even without internet connection

## Browser Compatibility

The caching system uses IndexedDB, which is supported in all modern browsers:
- Chrome 23+
- Firefox 16+
- Safari 10+
- Edge 12+

## Error Handling

The system includes comprehensive error handling:
- Graceful fallback to API calls if cache fails
- Console logging for debugging
- Automatic cache cleanup on errors

## Cache Statistics

You can monitor cache usage:

```javascript
const stats = await WikidataCache.getCacheStats();
console.log('Entities cached:', stats.entities);
console.log('Properties cached:', stats.properties);
```