# Wikidata Search & Disambiguation Functionality

This module provides advanced search and disambiguation capabilities for Wikidata entities and properties. It supports exact word sequence matching, fuzzy search, and context-aware disambiguation.

## Features

### 🔍 Search Methods

1. **Exact Match Search** - Find entities and properties that match the exact word sequence
2. **Fuzzy Search** - Find matches with partial or misspelled queries
3. **Disambiguation Search** - Combines exact and fuzzy matching with intelligent ranking
4. **Context-Aware Search** - Uses domain and type preferences for better ranking

### 🎯 Disambiguation Capabilities

- **Exact vs Fuzzy Matching** - Prioritizes exact matches over fuzzy ones
- **Type Filtering** - Search for entities, properties, or both
- **Language Support** - Multi-language search capabilities
- **Context Ranking** - Domain-aware and type-aware result ranking

## API Reference

### WikidataSearchUtility Class

The main search utility class that provides all search functionality.

#### Constructor
```javascript
const searchUtility = new WikidataSearchUtility(apiClient, cacheManager, dataProcessor);
```

#### Methods

##### `searchExactMatch(query, languages, limit, type)`
Search for entities and properties with exact word sequence matching.

**Parameters:**
- `query` (string) - Exact word sequence to search for
- `languages` (string) - Languages to search in (default: 'en')
- `limit` (number) - Maximum number of results (default: 50)
- `type` (string) - Type to search for: 'item', 'property', or 'both' (default: 'both')

**Returns:** Promise<Object>
```javascript
{
  entities: Array,
  properties: Array,
  total: number
}
```

##### `searchFuzzy(query, languages, limit, type)`
Search for entities and properties with fuzzy matching.

**Parameters:** Same as `searchExactMatch`

**Returns:** Same structure as `searchExactMatch`

##### `disambiguateSearch(query, languages, limit, type)`
Enhanced disambiguation search that combines exact and fuzzy matching.

**Parameters:** Same as `searchExactMatch`

**Returns:** Promise<Object>
```javascript
{
  exact: Array,      // Exact matches
  fuzzy: Array,      // Fuzzy matches
  combined: Array,   // All results combined
  total: number      // Total number of results
}
```

##### `searchWithContext(query, context, languages, limit, type)`
Context-aware search with domain and type preferences.

**Parameters:**
- `query` (string) - Query string to search for
- `context` (Object) - Context information for ranking
  - `domain` (string) - Domain context for ranking
  - `preferredTypes` (Array) - Array of preferred types
- `languages` (string) - Languages to search in (default: 'en')
- `limit` (number) - Maximum number of results (default: 50)
- `type` (string) - Type to search for (default: 'both')

**Returns:** Same structure as `disambiguateSearch`

## Usage Examples

### Basic Search

```javascript
import { searchUtility } from './wikidata-api.js';

// Exact match search
const results = await searchUtility.searchExactMatch('Albert Einstein', 'en', 10);
console.log(`Found ${results.total} results`);

// Fuzzy search
const fuzzyResults = await searchUtility.searchFuzzy('Einstien', 'en', 10);
console.log(`Found ${fuzzyResults.total} results`);
```

### Disambiguation Search

```javascript
// Disambiguation search for ambiguous terms
const parisResults = await searchUtility.disambiguateSearch('Paris', 'en', 20);
console.log(`Found ${parisResults.total} results`);
console.log(`Exact matches: ${parisResults.exact.length}`);
console.log(`Fuzzy matches: ${parisResults.fuzzy.length}`);

// Access combined results with match types
parisResults.combined.forEach(result => {
  console.log(`${result.label} (${result.id}) - ${result.matchType} match`);
});
```

### Context-Aware Search

```javascript
// Search with domain context
const physicsContext = {
  domain: 'physics',
  preferredTypes: ['item']
};

const physicsResults = await searchUtility.searchWithContext('Einstein', physicsContext, 'en', 10);
console.log(`Found ${physicsResults.total} physics-related results`);

// Search with property preference
const propertyContext = {
  preferredTypes: ['property']
};

const propertyResults = await searchUtility.searchWithContext('instance', propertyContext, 'en', 10);
console.log(`Found ${propertyResults.total} property results`);
```

### Type-Specific Search

```javascript
// Search only for entities
const entityResults = await searchUtility.searchExactMatch('Einstein', 'en', 10, 'item');
console.log(`Found ${entityResults.entities.length} entities`);

// Search only for properties
const propertyResults = await searchUtility.searchExactMatch('instance of', 'en', 10, 'property');
console.log(`Found ${propertyResults.properties.length} properties`);
```

### Multi-Language Search

```javascript
// Search in different languages
const enResults = await searchUtility.searchExactMatch('Einstein', 'en', 5);
const deResults = await searchUtility.searchExactMatch('Einstein', 'de', 5);
const frResults = await searchUtility.searchExactMatch('Einstein', 'fr', 5);

console.log(`English: ${enResults.total} results`);
console.log(`German: ${deResults.total} results`);
console.log(`French: ${frResults.total} results`);
```

## Result Structure

### Standard Search Results
```javascript
{
  entities: [
    {
      id: "Q937",
      label: "Albert Einstein",
      description: "German-born theoretical physicist",
      url: "https://www.wikidata.org/wiki/Q937"
    }
  ],
  properties: [
    {
      id: "P31",
      label: "instance of",
      description: "that class of which this subject is a particular example and member",
      url: "https://www.wikidata.org/wiki/P31"
    }
  ],
  total: 2
}
```

### Disambiguation Results
```javascript
{
  exact: [
    {
      id: "Q937",
      label: "Albert Einstein",
      description: "German-born theoretical physicist",
      matchType: "exact"
    }
  ],
  fuzzy: [
    {
      id: "Q12345",
      label: "Einstein Institute",
      description: "Research institute",
      matchType: "fuzzy"
    }
  ],
  combined: [...], // All results combined
  total: 2
}
```

## Testing

### Running Tests

```javascript
import { WikidataSearchTest } from './search-test.js';

const testSuite = new WikidataSearchTest();
await testSuite.runAllTests();
```

### Demo Function

```javascript
import { demonstrateSearchFeatures } from './search-test.js';

await demonstrateSearchFeatures();
```

### Browser Demo

Open `search-demo.html` in a web browser to interact with the search functionality through a user-friendly interface.

## Error Handling

The search functions throw errors for various failure scenarios:

```javascript
try {
  const results = await searchUtility.searchExactMatch('query');
} catch (error) {
  console.error('Search failed:', error.message);
}
```

Common error scenarios:
- Network connectivity issues
- Invalid query parameters
- API rate limiting
- Malformed responses

## Performance Considerations

### Caching
The search functionality leverages the existing caching system for:
- Entity and property data
- Label information
- Search results

### Rate Limiting
- Respects Wikidata API rate limits
- Implements batch processing for large queries
- Uses efficient pagination

### Optimization Tips
1. Use specific types when possible (e.g., 'item' instead of 'both')
2. Limit result counts to reasonable numbers
3. Use context-aware search for better relevance
4. Cache frequently searched terms

## Browser Compatibility

The search functionality works in all modern browsers that support:
- ES6 modules
- Fetch API
- IndexedDB (for caching)
- Async/await

## Node.js Support

For Node.js environments, you may need to:
1. Use a fetch polyfill (Node.js < 18)
2. Use an IndexedDB polyfill or disable caching
3. Handle CORS differently

## Contributing

When adding new search features:
1. Follow the existing code structure
2. Add comprehensive tests
3. Update documentation
4. Consider performance implications
5. Test with various query types and languages 