// Wikidata API utilities and functions
// This file contains all logic related to Wikidata API interactions

// API Configuration
const WIKIDATA_API_BASE = 'https://www.wikidata.org/w/api.php';

// Cache configuration
const CACHE_CONFIG = {
  DB_NAME: 'WikidataCache',
  VERSION: 1,
  STORES: {
    ENTITIES: 'entities',
    PROPERTIES: 'properties'
  }
};

/**
 * Wikidata API Client Class
 * Handles all interactions with the Wikidata API
 */
class WikidataAPIClient {
  constructor() {
    this.baseUrl = WIKIDATA_API_BASE;
  }

  /**
   * Build API URL with parameters
   * @param {Object} params - API parameters
   * @returns {string} - Complete API URL
   */
  buildApiUrl(params) {
    const urlParams = new URLSearchParams({
      ...params,
      format: 'json',
      origin: '*'
    });
    return `${this.baseUrl}?${urlParams.toString()}`;
  }

  /**
   * Fetch entities from Wikidata API
   * @param {string|Array} ids - Entity IDs to fetch
   * @param {string} props - Properties to fetch (labels|descriptions|claims)
   * @param {string} languages - Languages to fetch
   * @returns {Promise<Object>} - API response
   */
  async fetchEntities(ids, props = 'labels|descriptions', languages = 'en') {
    const idsParam = Array.isArray(ids) ? ids.join('|') : ids;
    const url = this.buildApiUrl({
      action: 'wbgetentities',
      ids: idsParam,
      props: props,
      languages: languages
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Fetch a single entity with all properties
   * @param {string} entityId - Entity ID (e.g., 'Q42')
   * @param {string} languages - Languages to fetch
   * @returns {Promise<Object>} - Entity data
   */
  async fetchEntity(entityId, languages = 'en') {
    const data = await this.fetchEntities(entityId, 'labels|descriptions|claims', languages);
    return data.entities[entityId];
  }

  /**
   * Fetch entity labels in batch
   * @param {Array} ids - Array of entity IDs
   * @param {string} languages - Languages to fetch
   * @returns {Promise<Object>} - Labels data
   */
  async fetchLabels(ids, languages = 'en') {
    const data = await this.fetchEntities(ids, 'labels', languages);
    return data.entities || {};
  }

  /**
   * Fetch property data
   * @param {string} propertyId - Property ID (e.g., 'P31')
   * @param {string} languages - Languages to fetch
   * @returns {Promise<Object>} - Property data
   */
  async fetchProperty(propertyId, languages = 'en') {
    const data = await this.fetchEntities(propertyId, 'labels|descriptions|claims', languages);
    return data.entities[propertyId];
  }
}

/**
 * Cache Manager for Wikidata data
 * Handles IndexedDB operations for caching Wikidata responses
 */
class WikidataCacheManager {
  constructor() {
    this.dbName = CACHE_CONFIG.DB_NAME;
    this.version = CACHE_CONFIG.VERSION;
    this.stores = CACHE_CONFIG.STORES;
  }

  /**
   * Initialize the database
   * @returns {Promise<IDBDatabase>} - Database instance
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(this.stores.ENTITIES)) {
          db.createObjectStore(this.stores.ENTITIES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.stores.PROPERTIES)) {
          db.createObjectStore(this.stores.PROPERTIES, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Get data from cache
   * @param {string} storeName - Store name (entities or properties)
   * @param {string} id - Entity/Property ID
   * @returns {Promise<Object|null>} - Cached data or null
   */
  async getFromCache(storeName, id) {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Save data to cache
   * @param {string} storeName - Store name (entities or properties)
   * @param {string} id - Entity/Property ID
   * @param {Object} data - Data to cache
   * @returns {Promise<void>}
   */
  async saveToCache(storeName, id, data) {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put({ id, data, timestamp: Date.now() });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  /**
   * Check if cached data is complete
   * @param {Object} cachedData - Cached data object
   * @param {string} languages - Required languages
   * @returns {boolean} - Whether data is complete
   */
  isCachedDataComplete(cachedData, languages) {
    if (!cachedData || !cachedData.data) return false;
    
    const data = cachedData.data;
    const requiredLangs = languages.split('|');
    
    // Check if we have labels and descriptions for required languages
    const hasLabels = data.labels && Object.keys(data.labels).length > 0;
    const hasDescriptions = data.descriptions && Object.keys(data.descriptions).length > 0;
    
    // For properties, we also want to check if we have claims data
    const hasClaims = data.claims && Object.keys(data.claims).length > 0;
    
    return hasLabels && hasDescriptions && hasClaims;
  }
}

/**
 * Wikidata Data Processor
 * Handles processing and formatting of Wikidata data
 */
class WikidataDataProcessor {
  /**
   * Extract property and entity IDs from statements
   * @param {Object} claims - Claims object from Wikidata
   * @returns {Object} - Object with propertyIds and entityIds sets
   */
  extractIdsFromClaims(claims) {
    const propertyIds = new Set();
    const entityIds = new Set();
    
    Object.values(claims || {}).forEach(claimsArray => {
      if (Array.isArray(claimsArray)) {
        claimsArray.forEach(claim => {
          if (claim.mainsnak && claim.mainsnak.property) {
            propertyIds.add(claim.mainsnak.property);
          }
          if (claim.mainsnak && claim.mainsnak.datavalue && claim.mainsnak.datavalue.value) {
            const value = claim.mainsnak.datavalue.value;
            if (claim.mainsnak.datatype === 'wikibase-item' && value.id) {
              entityIds.add(value.id);
            }
          }
        });
      }
    });
    
    return { propertyIds, entityIds };
  }

  /**
   * Format fact value based on datatype
   * @param {Object} claim - Wikidata claim
   * @param {Function} getEntityLabel - Function to get entity labels
   * @returns {string} - Formatted value
   */
  formatFactValue(claim, getEntityLabel) {
    if (claim.mainsnak.datavalue) {
      const value = claim.mainsnak.datavalue.value;
      if (claim.mainsnak.datatype === 'wikibase-item') {
        return getEntityLabel(value.id);
      } else if (claim.mainsnak.datatype === 'time') {
        return value.time;
      } else if (claim.mainsnak.datatype === 'quantity') {
        return value.amount;
      } else if (claim.mainsnak.datatype === 'string') {
        return value;
      } else if (claim.mainsnak.datatype === 'url') {
        return value;
      } else if (claim.mainsnak.datatype === 'external-id') {
        return value;
      } else if (claim.mainsnak.datatype === 'commonsMedia') {
        return value;
      } else if (claim.mainsnak.datatype === 'geo-coordinate') {
        return `${value.latitude}, ${value.longitude}`;
      } else if (claim.mainsnak.datatype === 'monolingualtext') {
        return value.text;
      } else if (claim.mainsnak.datatype === 'wikibase-lexeme') {
        return value.id;
      } else if (claim.mainsnak.datatype === 'wikibase-form') {
        return value.id;
      } else if (claim.mainsnak.datatype === 'wikibase-sense') {
        return value.id;
      }
    }
    return 'Unknown value type';
  }

  /**
   * Get label for entity or property with fallbacks
   * @param {Object} labels - Labels object
   * @param {string} selectedLanguage - Preferred language
   * @param {string} fallbackId - ID to return if no label found
   * @returns {string} - Label or fallback ID
   */
  getLabel(labels, selectedLanguage, fallbackId) {
    if (labels && labels[selectedLanguage]) {
      return labels[selectedLanguage].value;
    }
    // Fallback to English
    if (labels && labels.en) {
      return labels.en.value;
    }
    // Fallback to any available language
    if (labels) {
      const firstLang = Object.keys(labels)[0];
      return labels[firstLang].value;
    }
    return fallbackId;
  }
}

/**
 * Label Manager for Wikidata entities and properties
 * Handles loading and caching of labels for entities and properties referenced in statements
 */
class WikidataLabelManager {
  constructor(apiClient, cacheManager, dataProcessor) {
    this.apiClient = apiClient;
    this.cacheManager = cacheManager;
    this.dataProcessor = dataProcessor;
  }

  /**
   * Load all labels for entities and properties referenced in statements
   * @param {Object} claims - Claims object from Wikidata
   * @param {string} languages - Languages to fetch
   * @returns {Promise<Object>} - Object with propertyLabels and entityLabels
   */
  async loadAllLabels(claims, languages) {
    console.log('Loading all labels for claims:', claims);
    
    // Extract IDs from claims
    const { propertyIds, entityIds } = this.dataProcessor.extractIdsFromClaims(claims);
    const allIds = [...propertyIds, ...entityIds];
    
    if (allIds.length === 0) {
      console.log('No IDs found in claims');
      return { propertyLabels: {}, entityLabels: {} };
    }

    const newPropertyLabels = {};
    const newEntityLabels = {};
    const uncachedIds = [];

    // Check cache for each ID
    for (const id of allIds) {
      const storeName = id.startsWith('P') ? this.cacheManager.stores.PROPERTIES : this.cacheManager.stores.ENTITIES;
      const cachedData = await this.cacheManager.getFromCache(storeName, id);
      if (cachedData && cachedData.data) {
        if (id.startsWith('P')) {
          newPropertyLabels[id] = cachedData.data.labels || {};
        } else {
          newEntityLabels[id] = cachedData.data.labels || {};
        }
      } else {
        uncachedIds.push(id);
      }
    }

    // Fetch uncached IDs from API in batches
    if (uncachedIds.length > 0) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
        const batchIds = uncachedIds.slice(i, i + BATCH_SIZE);
        try {
          const entities = await this.apiClient.fetchLabels(batchIds, languages);
          if (!entities || Object.keys(entities).length === 0) {
            console.error('No entities returned for label fetch:', batchIds);
          }
          Object.entries(entities || {}).forEach(([id, entity]) => {
            // Save to cache
            const storeName = id.startsWith('P') ? this.cacheManager.stores.PROPERTIES : this.cacheManager.stores.ENTITIES;
            this.cacheManager.saveToCache(storeName, id, entity);
            if (id.startsWith('P')) {
              newPropertyLabels[id] = entity.labels || {};
            } else if (id.startsWith('Q')) {
              newEntityLabels[id] = entity.labels || {};
            }
          });
        } catch (error) {
          console.error('Error fetching labels:', error);
        }
      }
    }

    console.log('Setting property labels:', newPropertyLabels);
    console.log('Setting entity labels:', newEntityLabels);
    
    return {
      propertyLabels: newPropertyLabels,
      entityLabels: newEntityLabels
    };
  }

  /**
   * Create a unified getLabel function that handles current subject and referenced entities/properties
   * @param {string} subjectId - Current subject ID (entity or property)
   * @param {Object} mainLabels - Main labels for the current subject
   * @param {Object} entityLabels - Labels for referenced entities
   * @param {Object} propertyLabels - Labels for referenced properties
   * @param {string} selectedLanguage - Selected language
   * @returns {Function} - getLabel function
   */
  createGetLabelFunction(subjectId, mainLabels, entityLabels, propertyLabels, selectedLanguage) {
    return (id) => {
      // If this is the current subject, use the main labels
      if (id === subjectId) {
        return this.dataProcessor.getLabel(mainLabels, selectedLanguage, id);
      }
      // Check entity labels
      if (entityLabels[id]) {
        return this.dataProcessor.getLabel(entityLabels[id], selectedLanguage, id);
      }
      // Check property labels
      if (propertyLabels[id]) {
        return this.dataProcessor.getLabel(propertyLabels[id], selectedLanguage, id);
      }
      // Fallback to ID
      return id;
    };
  }
}

// Create global instances
const apiClientInstance = new WikidataAPIClient();
const cacheManagerInstance = new WikidataCacheManager();
const dataProcessorInstance = new WikidataDataProcessor();
const labelManagerInstance = new WikidataLabelManager(apiClientInstance, cacheManagerInstance, dataProcessorInstance);

// Export classes and instances
export {
  WikidataAPIClient,
  WikidataCacheManager,
  WikidataDataProcessor,
  WikidataLabelManager,
  apiClientInstance as client,
  cacheManagerInstance as cache,
  dataProcessorInstance as processor,
  labelManagerInstance as labelManager
}; 