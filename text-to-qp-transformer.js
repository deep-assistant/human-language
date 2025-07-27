// Text to Wikidata Q/P Transformer
// Transforms English text into sequences of Wikidata entities (Q) and properties (P)
// with disambiguation support using [Q1 or Q2 or Q3] syntax

// Import appropriate API based on environment
let WikidataAPIClient, WikidataSearchUtility;

if (typeof window !== 'undefined') {
  // Browser environment
  const module = await import('./wikidata-api-browser.js');
  WikidataAPIClient = module.WikidataAPIClient;
  WikidataSearchUtility = module.WikidataSearchUtility;
} else {
  // Node.js environment
  const module = await import('./wikidata-api.js');
  WikidataAPIClient = module.WikidataAPIClient;  
  WikidataSearchUtility = module.WikidataSearchUtility;
}

/**
 * Text to Q/P Transformer Class
 * Converts English text into sequences of Wikidata identifiers
 */
class TextToQPTransformer {
  constructor() {
    this.apiClient = new WikidataAPIClient();
    this.searchUtility = new WikidataSearchUtility(this.apiClient, null, null);
    
    // Common English words that should be properties
    this.propertyIndicators = [
      'is', 'was', 'are', 'were', 'has', 'have', 'had',
      'born', 'died', 'located', 'created', 'founded',
      'married', 'wrote', 'directed', 'invented', 'discovered',
      'contains', 'belongs', 'relates', 'connects', 'instance of',
      'part of', 'member of', 'capital of', 'owned by', 'child of',
      'parent of', 'spouse of', 'sibling of'
    ];
    
    // Words to skip entirely
    this.stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  }

  /**
   * Transform English text into Q/P sequences
   * @param {string} text - The English text to transform
   * @param {Object} options - Transformation options
   * @returns {Promise<Object>} - Transformation result
   */
  async transform(text, options = {}) {
    const {
      maxCandidates = 3,
      includeLabels = false,
      searchLimit = 10,
      preferProperties = false
    } = options;

    const result = {
      original: text,
      tokens: [],
      sequence: [],
      formatted: '',
      alternatives: []
    };

    try {
      // Tokenize the text
      const tokens = this.tokenize(text);
      result.tokens = tokens;

      // Process each token
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        // Skip stop words
        if (this.stopWords.includes(token.toLowerCase())) {
          continue;
        }

        // Check for multi-word phrases
        let phrase = token;
        let phraseLength = 1;
        
        // Try to build longer phrases (up to 4 words)
        for (let j = 1; j <= 3 && i + j < tokens.length; j++) {
          const nextToken = tokens[i + j];
          if (!this.stopWords.includes(nextToken.toLowerCase())) {
            const testPhrase = tokens.slice(i, i + j + 1).join(' ');
            const testResults = await this.searchForTerm(testPhrase, preferProperties, 1);
            
            if (testResults.exact.length > 0 || testResults.fuzzy.length > 0) {
              phrase = testPhrase;
              phraseLength = j + 1;
            }
          }
        }

        // Search for the term
        const searchResults = await this.searchForTerm(phrase, preferProperties, searchLimit);
        
        // Process search results
        const candidates = this.processCandidates(searchResults, maxCandidates);
        
        if (candidates.length > 0) {
          const qpItem = this.formatCandidates(candidates, includeLabels);
          result.sequence.push(qpItem);
          
          // Skip tokens that were part of the phrase
          i += phraseLength - 1;
        }
      }

      // Format the final sequence
      result.formatted = this.formatSequence(result.sequence);
      result.formattedWithLinks = this.formatSequenceWithLinks(result.sequence);
      
      // Generate alternative sequences if there are ambiguous matches
      result.alternatives = this.generateAlternatives(result.sequence);

    } catch (error) {
      console.error('Error transforming text:', error);
      throw new Error(`Transformation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Tokenize the input text
   * @param {string} text - Text to tokenize
   * @returns {Array<string>} - Array of tokens
   */
  tokenize(text) {
    // Basic tokenization - can be improved with NLP libraries
    return text
      .replace(/[.,!?;:]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(token => token.length > 0);
  }

  /**
   * Search for a term in Wikidata
   * @param {string} term - Term to search for
   * @param {boolean} preferProperties - Whether to prefer properties over entities
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} - Search results
   */
  async searchForTerm(term, preferProperties, limit) {
    // Determine if this term is likely a property
    const isLikelyProperty = this.propertyIndicators.some(indicator => 
      term.toLowerCase().includes(indicator)
    );
    
    const searchType = (preferProperties || isLikelyProperty) ? 'property' : 'both';
    
    // Use disambiguation search for better results
    return await this.searchUtility.disambiguateSearch(term, 'en', limit, searchType);
  }

  /**
   * Process candidates from search results
   * @param {Object} searchResults - Search results from Wikidata
   * @param {number} maxCandidates - Maximum number of candidates to return
   * @returns {Array} - Processed candidates
   */
  processCandidates(searchResults, maxCandidates) {
    const candidates = [];
    const seenIds = new Set();
    
    // Add exact matches first
    searchResults.exact.forEach(item => {
      if (candidates.length < maxCandidates && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        candidates.push({
          id: item.id,
          label: item.label,
          description: item.description,
          type: item.id.startsWith('P') ? 'property' : 'entity',
          matchType: 'exact'
        });
      }
    });
    
    // Add fuzzy matches if needed
    if (candidates.length < maxCandidates) {
      searchResults.fuzzy.forEach(item => {
        if (candidates.length < maxCandidates && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          candidates.push({
            id: item.id,
            label: item.label,
            description: item.description,
            type: item.id.startsWith('P') ? 'property' : 'entity',
            matchType: 'fuzzy'
          });
        }
      });
    }
    
    return candidates;
  }

  /**
   * Format candidates into Q/P notation
   * @param {Array} candidates - Array of candidates
   * @param {boolean} includeLabels - Whether to include labels
   * @returns {Object} - Formatted Q/P item
   */
  formatCandidates(candidates, includeLabels) {
    if (candidates.length === 0) {
      return null;
    }
    
    if (candidates.length === 1) {
      // Single match
      const candidate = candidates[0];
      return {
        id: candidate.id,
        label: includeLabels ? candidate.label : null,
        type: candidate.type,
        alternatives: []
      };
    } else {
      // Multiple matches - use disambiguation syntax
      return {
        id: `[${candidates.map(c => c.id).join(' or ')}]`,
        label: includeLabels ? `[${candidates.map(c => c.label).join(' or ')}]` : null,
        type: 'ambiguous',
        alternatives: candidates
      };
    }
  }

  /**
   * Format the sequence into a string
   * @param {Array} sequence - Array of Q/P items
   * @returns {string} - Formatted string
   */
  formatSequence(sequence) {
    return sequence
      .filter(item => item !== null)
      .map(item => item.id)
      .join(' ');
  }

  /**
   * Format the sequence into HTML with links
   * @param {Array} sequence - Array of Q/P items
   * @returns {string} - Formatted HTML string with links
   */
  formatSequenceWithLinks(sequence) {
    return sequence
      .filter(item => item !== null)
      .map(item => {
        if (item.type === 'ambiguous') {
          // For ambiguous items, we need to handle the bracketed format
          const ids = item.id.match(/[QP]\d+/g) || [];
          const linkedIds = ids.map(id => {
            if (id.startsWith('Q')) {
              return `<a href="entities.html#${id}" target="_blank">${id}</a>`;
            } else if (id.startsWith('P')) {
              return `<a href="properties.html#${id}" target="_blank">${id}</a>`;
            }
            return id;
          });
          // Reconstruct the ambiguous format with links
          return `[${linkedIds.join(' or ')}]`;
        } else {
          // Single ID
          const id = item.id;
          if (id.startsWith('Q')) {
            return `<a href="entities.html#${id}" target="_blank">${id}</a>`;
          } else if (id.startsWith('P')) {
            return `<a href="properties.html#${id}" target="_blank">${id}</a>`;
          }
          return id;
        }
      })
      .join(' ');
  }

  /**
   * Generate alternative sequences for disambiguation
   * @param {Array} sequence - Original sequence with ambiguous items
   * @returns {Array} - Array of alternative sequences
   */
  generateAlternatives(sequence) {
    const alternatives = [];
    const ambiguousItems = sequence.filter(item => item && item.type === 'ambiguous');
    
    if (ambiguousItems.length === 0) {
      return alternatives;
    }
    
    // For now, just return the first alternative for each ambiguous item
    // This could be expanded to generate all possible combinations
    const alternativeSequence = sequence.map(item => {
      if (item && item.type === 'ambiguous' && item.alternatives.length > 0) {
        return item.alternatives[0].id;
      }
      return item ? item.id : null;
    }).filter(id => id !== null);
    
    if (alternativeSequence.length > 0) {
      alternatives.push({
        sequence: alternativeSequence.join(' '),
        confidence: 'low'
      });
    }
    
    return alternatives;
  }

  /**
   * Transform with context for better disambiguation
   * @param {string} text - Text to transform
   * @param {Object} context - Context information
   * @param {Object} options - Transformation options
   * @returns {Promise<Object>} - Transformation result with context-aware disambiguation
   */
  async transformWithContext(text, context = {}, options = {}) {
    // This could be enhanced to use context for better disambiguation
    const result = await this.transform(text, options);
    
    // Apply context-based filtering if available
    if (context.domain) {
      // Filter candidates based on domain
      result.sequence = result.sequence.map(item => {
        if (item && item.type === 'ambiguous') {
          const filtered = item.alternatives.filter(alt => 
            alt.description && alt.description.toLowerCase().includes(context.domain.toLowerCase())
          );
          if (filtered.length > 0) {
            return this.formatCandidates(filtered, options.includeLabels);
          }
        }
        return item;
      });
      
      result.formatted = this.formatSequence(result.sequence);
      result.formattedWithLinks = this.formatSequenceWithLinks(result.sequence);
    }
    
    return result;
  }
}

export { TextToQPTransformer };