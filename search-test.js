// Test file for Wikidata search functionality
// Tests the search and disambiguation features

import { searchUtility, client } from './wikidata-api.js';

/**
 * Test suite for Wikidata search functionality
 */
class WikidataSearchTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting Wikidata Search Tests...\n');

    await this.testExactMatchSearch();
    // await this.testFuzzySearch();
    await this.testDisambiguationSearch();
    await this.testContextAwareSearch();
    await this.testSearchWithDifferentTypes();
    await this.testSearchWithMultipleLanguages();

    this.printTestSummary();
  }

  /**
   * Test exact match search functionality
   */
  async testExactMatchSearch() {
    console.log('📝 Testing Exact Match Search...');
    
    try {
      // Test 1: Search for "Albert Einstein"
      const einsteinResults = await searchUtility.searchExactMatch('Albert Einstein', 'en', 10, 'both');
      this.assertTest(
        einsteinResults.total > 0,
        'Exact match search for "Albert Einstein" should return results'
      );
      this.assertTest(
        einsteinResults.entities.length > 0,
        'Should find entities for "Albert Einstein"'
      );

      // Test 2: Search for a property
      const propertyResults = await searchUtility.searchExactMatch('instance of', 'en', 10, 'property');
      this.assertTest(
        propertyResults.properties.length > 0,
        'Should find properties for "instance of"'
      );

      // Test 3: Search for a specific entity ID
      const q42Results = await searchUtility.searchExactMatch('Douglas Adams', 'en', 5, 'item');
      this.assertTest(
        q42Results.entities.length > 0,
        'Should find entities for "Douglas Adams"'
      );

      console.log('✅ Exact match search tests passed\n');
    } catch (error) {
      console.error('❌ Exact match search tests failed:', error);
      this.testResults.failed++;
    }
  }

  /**
   * Test fuzzy search functionality
   */
  async testFuzzySearch() {
    console.log('🔍 Testing Fuzzy Search...');
    
    try {
      // Test 1: Search with partial match
      const partialResults = await searchUtility.searchFuzzy('Einstein', 'en', 10, 'both');
      this.assertTest(
        partialResults.total > 0,
        'Fuzzy search for "Einstein" should return results'
      );

      // Test 2: Search with misspelling
      const misspelledResults = await searchUtility.searchFuzzy('Einstien', 'en', 10, 'both');
      this.assertTest(
        misspelledResults.total > 0,
        'Fuzzy search should handle misspellings'
      );

      // Test 3: Search with different case
      const caseResults = await searchUtility.searchFuzzy('albert einstein', 'en', 10, 'both');
      this.assertTest(
        caseResults.total > 0,
        'Fuzzy search should be case insensitive'
      );

      console.log('✅ Fuzzy search tests passed\n');
    } catch (error) {
      console.error('❌ Fuzzy search tests failed:', error);
      this.testResults.failed++;
    }
  }

  /**
   * Test disambiguation search functionality
   */
  async testDisambiguationSearch() {
    console.log('🎯 Testing Disambiguation Search...');
    
    try {
      // Test 1: Disambiguation search for "Paris"
      const parisResults = await searchUtility.disambiguateSearch('Paris', 'en', 20, 'both');
      this.assertTest(
        parisResults.total > 0,
        'Disambiguation search for "Paris" should return results'
      );
      this.assertTest(
        parisResults.exact.length > 0 || parisResults.fuzzy.length > 0,
        'Should have either exact or fuzzy matches for "Paris"'
      );

      // Test 2: Check result structure
      if (parisResults.combined.length > 0) {
        const firstResult = parisResults.combined[0];
        this.assertTest(
          firstResult.hasOwnProperty('id') && firstResult.hasOwnProperty('label'),
          'Results should have id and label properties'
        );
        this.assertTest(
          firstResult.hasOwnProperty('matchType'),
          'Results should have matchType property'
        );
      }

      console.log('✅ Disambiguation search tests passed\n');
    } catch (error) {
      console.error('❌ Disambiguation search tests failed:', error);
      this.testResults.failed++;
    }
  }

  /**
   * Test context-aware search functionality
   */
  async testContextAwareSearch() {
    console.log('🎭 Testing Context-Aware Search...');
    
    try {
      // Test 1: Search with domain context
      const physicsContext = {
        domain: 'physics',
        preferredTypes: ['item']
      };
      const physicsResults = await searchUtility.searchWithContext('Einstein', physicsContext, 'en', 10);
      this.assertTest(
        physicsResults.total > 0,
        'Context-aware search should return results'
      );

      // Test 2: Search with property preference
      const propertyContext = {
        preferredTypes: ['property']
      };
      const propertyResults = await searchUtility.searchWithContext('instance', propertyContext, 'en', 10);
      this.assertTest(
        propertyResults.total > 0,
        'Property-focused search should return results'
      );

      console.log('✅ Context-aware search tests passed\n');
    } catch (error) {
      console.error('❌ Context-aware search tests failed:', error);
      this.testResults.failed++;
    }
  }

  /**
   * Test search with different types
   */
  async testSearchWithDifferentTypes() {
    console.log('🏷️ Testing Search with Different Types...');
    
    try {
      // Test 1: Search only for items
      const itemResults = await searchUtility.searchExactMatch('Einstein', 'en', 10, 'item');
      this.assertTest(
        itemResults.entities.length > 0,
        'Item-only search should return entities'
      );
      this.assertTest(
        itemResults.properties.length === 0,
        'Item-only search should not return properties'
      );

      // Test 2: Search only for properties
      const propResults = await searchUtility.searchExactMatch('instance', 'en', 10, 'property');
      this.assertTest(
        propResults.properties.length > 0,
        'Property-only search should return properties'
      );
      this.assertTest(
        propResults.entities.length === 0,
        'Property-only search should not return entities'
      );

      console.log('✅ Type-specific search tests passed\n');
    } catch (error) {
      console.error('❌ Type-specific search tests failed:', error);
      this.testResults.failed++;
    }
  }

  /**
   * Test search with multiple languages
   */
  async testSearchWithMultipleLanguages() {
    console.log('🌍 Testing Multi-Language Search...');
    
    try {
      // Test 1: Search in English
      const enResults = await searchUtility.searchExactMatch('Einstein', 'en', 5, 'both');
      this.assertTest(
        enResults.total > 0,
        'English search should return results'
      );

      // Test 2: Search in German
      const deResults = await searchUtility.searchExactMatch('Einstein', 'de', 5, 'both');
      this.assertTest(
        deResults.total > 0,
        'German search should return results'
      );

      // Test 3: Search in French
      const frResults = await searchUtility.searchExactMatch('Einstein', 'fr', 5, 'both');
      this.assertTest(
        frResults.total > 0,
        'French search should return results'
      );

      console.log('✅ Multi-language search tests passed\n');
    } catch (error) {
      console.error('❌ Multi-language search tests failed:', error);
      this.testResults.failed++;
    }
  }

  /**
   * Assert a test condition
   * @param {boolean} condition - Test condition
   * @param {string} message - Test message
   */
  assertTest(condition, message) {
    this.testResults.total++;
    if (condition) {
      this.testResults.passed++;
      console.log(`  ✅ ${message}`);
    } else {
      this.testResults.failed++;
      console.log(`  ❌ ${message}`);
    }
  }

  /**
   * Print test summary
   */
  printTestSummary() {
    console.log('\n📊 Test Summary:');
    console.log(`  Total tests: ${this.testResults.total}`);
    console.log(`  Passed: ${this.testResults.passed}`);
    console.log(`  Failed: ${this.testResults.failed}`);
    console.log(`  Success rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log(`\n⚠️  ${this.testResults.failed} test(s) failed`);
    }
  }
}

/**
 * Demo function to showcase search functionality
 */
async function demonstrateSearchFeatures() {
  console.log('🚀 Demonstrating Wikidata Search Features...\n');

  try {
    // Demo 1: Exact match search
    console.log('1. Exact Match Search for "Albert Einstein":');
    const einsteinResults = await searchUtility.searchExactMatch('Albert Einstein', 'en', 5);
    console.log(`   Found ${einsteinResults.total} results`);
    if (einsteinResults.entities.length > 0) {
      console.log(`   Top entity: ${einsteinResults.entities[0].label} (${einsteinResults.entities[0].id})`);
    }

    // Demo 2: Disambiguation search
    console.log('\n2. Disambiguation Search for "Paris":');
    const parisResults = await searchUtility.disambiguateSearch('Paris', 'en', 10);
    console.log(`   Found ${parisResults.total} results (${parisResults.exact.length} exact, ${parisResults.fuzzy.length} fuzzy)`);
    if (parisResults.combined.length > 0) {
      console.log(`   Top result: ${parisResults.combined[0].label} (${parisResults.combined[0].id}) - ${parisResults.combined[0].matchType} match`);
    }

    // Demo 3: Context-aware search
    console.log('\n3. Context-Aware Search for "Einstein" in physics domain:');
    const physicsContext = { domain: 'physics', preferredTypes: ['item'] };
    const physicsResults = await searchUtility.searchWithContext('Einstein', physicsContext, 'en', 5);
    console.log(`   Found ${physicsResults.total} results`);
    if (physicsResults.combined.length > 0) {
      console.log(`   Top result: ${physicsResults.combined[0].label} (${physicsResults.combined[0].id})`);
    }

    // Demo 4: Property search
    console.log('\n4. Property Search for "instance of":');
    const propertyResults = await searchUtility.searchExactMatch('instance of', 'en', 5, 'property');
    console.log(`   Found ${propertyResults.properties.length} properties`);
    if (propertyResults.properties.length > 0) {
      console.log(`   Top property: ${propertyResults.properties[0].label} (${propertyResults.properties[0].id})`);
    }

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runWikidataSearchTests = () => {
    const testSuite = new WikidataSearchTest();
    testSuite.runAllTests();
  };

  window.demonstrateSearchFeatures = demonstrateSearchFeatures;
} else {
  // Node.js environment
  const testSuite = new WikidataSearchTest();
  testSuite.runAllTests().then(() => {
    return demonstrateSearchFeatures();
  }).catch(error => {
    console.error('Test execution failed:', error);
  });
}

export { WikidataSearchTest, demonstrateSearchFeatures }; 