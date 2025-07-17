// IndexedDB caching utilities for Wikidata Viewer
const CACHE_CONFIG = {
  dbName: 'WikidataCache',
  dbVersion: 1,
  stores: {
    entities: 'entities',
    properties: 'properties'
  },
  maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

// Open IndexedDB database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_CONFIG.dbName, CACHE_CONFIG.dbVersion);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create entity store
      if (!db.objectStoreNames.contains(CACHE_CONFIG.stores.entities)) {
        const entityObjectStore = db.createObjectStore(CACHE_CONFIG.stores.entities, { keyPath: 'id' });
        entityObjectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Create property store
      if (!db.objectStoreNames.contains(CACHE_CONFIG.stores.properties)) {
        const propertyObjectStore = db.createObjectStore(CACHE_CONFIG.stores.properties, { keyPath: 'id' });
        propertyObjectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Get data from cache
async function getFromCache(storeName, id) {
  try {
    const db = await openDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const data = request.result;
        if (data && data.timestamp) {
          // Check if cache is still valid
          const now = Date.now();
          const cacheAge = now - data.timestamp;
          
          if (cacheAge < CACHE_CONFIG.maxAge) {
            resolve(data.data);
          } else {
            // Cache expired, remove it
            const deleteTransaction = db.transaction([storeName], 'readwrite');
            const deleteStore = deleteTransaction.objectStore(storeName);
            deleteStore.delete(id);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

// Save data to cache
async function saveToCache(storeName, id, data) {
  try {
    const db = await openDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const cacheEntry = {
      id,
      data,
      timestamp: Date.now()
    };
    
    store.put(cacheEntry);
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

// Fetch data with caching support
async function fetchWithCache(storeName, id, fetchFunction) {
  try {
    // Try to get from cache first
    let data = await getFromCache(storeName, id);
    
    if (!data) {
      // Cache miss, fetch from API
      console.log(`Cache miss for ${storeName}:${id}, fetching from API`);
      data = await fetchFunction();
      
      // Save to cache if we got data
      if (data) {
        await saveToCache(storeName, id, data);
      }
    } else {
      console.log(`Cache hit for ${storeName}:${id}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error in fetchWithCache for ${storeName}:${id}:`, error);
    return null;
  }
}

// Fetch entity data with caching
async function fetchEntityData(entityId, languages) {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=labels|descriptions|claims&languages=${languages}&format=json&origin=*`;
  
  const fetchFunction = async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.entities[entityId];
  };
  
  return fetchWithCache(CACHE_CONFIG.stores.entities, entityId, fetchFunction);
}

// Fetch property data with caching
async function fetchPropertyData(propertyId, languages) {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${propertyId}&props=labels|descriptions&languages=${languages}&format=json&origin=*`;
  
  const fetchFunction = async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.entities[propertyId];
  };
  
  return fetchWithCache(CACHE_CONFIG.stores.properties, propertyId, fetchFunction);
}

// Fetch multiple labels with caching
async function fetchMultipleLabels(ids, languages) {
  const BATCH_SIZE = 50;
  const results = {};
  
  // Separate properties and entities
  const propertyIds = ids.filter(id => id.startsWith('P'));
  const entityIds = ids.filter(id => id.startsWith('Q'));
  
  // Process properties
  for (let i = 0; i < propertyIds.length; i += BATCH_SIZE) {
    const batchIds = propertyIds.slice(i, i + BATCH_SIZE);
    const idsParam = batchIds.join('|');
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${idsParam}&props=labels&languages=${languages}&format=json&origin=*`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        Object.entries(data.entities || {}).forEach(([id, entity]) => {
          // Save to cache
          saveToCache(CACHE_CONFIG.stores.properties, id, entity);
          results[id] = entity.labels || {};
        });
      }
    } catch (error) {
      console.error('Error fetching property labels:', error);
    }
  }
  
  // Process entities
  for (let i = 0; i < entityIds.length; i += BATCH_SIZE) {
    const batchIds = entityIds.slice(i, i + BATCH_SIZE);
    const idsParam = batchIds.join('|');
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${idsParam}&props=labels&languages=${languages}&format=json&origin=*`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        Object.entries(data.entities || {}).forEach(([id, entity]) => {
          // Save to cache
          saveToCache(CACHE_CONFIG.stores.entities, id, entity);
          results[id] = entity.labels || {};
        });
      }
    } catch (error) {
      console.error('Error fetching entity labels:', error);
    }
  }
  
  return results;
}

// Clear expired cache entries
async function clearExpiredCache() {
  try {
    const db = await openDB();
    const now = Date.now();
    
    for (const storeName of Object.values(CACHE_CONFIG.stores)) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const data = cursor.value;
          if (now - data.timestamp > CACHE_CONFIG.maxAge) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}

// Clear all cache
async function clearAllCache() {
  try {
    const db = await openDB();
    
    for (const storeName of Object.values(CACHE_CONFIG.stores)) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.clear();
    }
    
    console.log('All cache cleared');
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

// Get cache statistics
async function getCacheStats() {
  try {
    const db = await openDB();
    const stats = {};
    
    for (const storeName of Object.values(CACHE_CONFIG.stores)) {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      stats[storeName] = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {};
  }
}

// Export functions for use in other files
window.WikidataCache = {
  fetchEntityData,
  fetchPropertyData,
  fetchMultipleLabels,
  getFromCache,
  saveToCache,
  clearExpiredCache,
  clearAllCache,
  getCacheStats,
  CACHE_CONFIG
};

// Initialize cache cleanup on page load
document.addEventListener('DOMContentLoaded', () => {
  // Clear expired entries when the page loads
  clearExpiredCache().catch(error => {
    console.error('Error clearing expired cache on page load:', error);
  });
});