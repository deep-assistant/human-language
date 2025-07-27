#!/usr/bin/env node

// Node.js test runner for Text to Q/P Transformer
// Run with: bun run-test.mjs

import { TextToQPTransformer } from './text-to-qp-transformer.js';

/**
 * Mock Wikidata API responses for testing
 */
class MockWikidataAPIClient {
  constructor() {
    this.mockData = {
      'Barack Obama': {
        entities: [{ id: 'Q76', label: 'Barack Obama', description: '44th President of the United States' }],
        properties: []
      },
      'Hawaii': {
        entities: [
          { id: 'Q782', label: 'Hawaii', description: 'state of the United States of America' },
          { id: 'Q18094', label: 'Hawaii', description: 'island' },
          { id: 'Q131750', label: 'Hawaii', description: 'volcanic island chain' }
        ],
        properties: []
      },
      'born': {
        entities: [],
        properties: [{ id: 'P569', label: 'date of birth', description: 'date on which the subject was born' }]
      },
      'was born': {
        entities: [],
        properties: [{ id: 'P569', label: 'date of birth', description: 'date on which the subject was born' }]
      },
      'Albert Einstein': {
        entities: [{ id: 'Q937', label: 'Albert Einstein', description: 'German-born theoretical physicist' }],
        properties: []
      },
      'Paris': {
        entities: [{ id: 'Q90', label: 'Paris', description: 'capital city of France' }],
        properties: []
      }
    };
  }

  async searchExactMatch(query, languages = 'en', limit = 50, type = 'both') {
    const mockResult = this.mockData[query] || { entities: [], properties: [] };
    return {
      entities: mockResult.entities || [],
      properties: mockResult.properties || [],
      total: (mockResult.entities?.length || 0) + (mockResult.properties?.length || 0)
    };
  }

  async searchFuzzy(query, languages = 'en', limit = 50, type = 'both') {
    // For fuzzy search, return similar results or empty
    return this.searchExactMatch(query, languages, limit, type);
  }
}

/**
 * Mock Search Utility
 */
class MockWikidataSearchUtility {
  constructor() {
    this.apiClient = new MockWikidataAPIClient();
  }

  async disambiguateSearch(query, languages = 'en', limit = 50, type = 'both') {
    const exactResults = await this.apiClient.searchExactMatch(query, languages, limit, type);
    const fuzzyResults = await this.apiClient.searchFuzzy(query, languages, limit, type);
    
    return {
      exact: [...(exactResults.entities || []), ...(exactResults.properties || [])],
      fuzzy: [...(fuzzyResults.entities || []), ...(fuzzyResults.properties || [])],
      combined: [...(exactResults.entities || []), ...(exactResults.properties || []), 
                ...(fuzzyResults.entities || []), ...(fuzzyResults.properties || [])],
      total: exactResults.total + fuzzyResults.total
    };
  }
}

/**
 * Test-specific TextToQPTransformer with mocked API
 */
class TestTextToQPTransformer extends TextToQPTransformer {
  constructor() {
    super();
    this.searchUtility = new MockWikidataSearchUtility();
  }
}

/**
 * Test Suite
 */
class TextTransformerTest {
  constructor() {
    this.transformer = new TestTextToQPTransformer();
    this.testCases = [
      {
        name: "Barack Obama birthplace example",
        input: "Barack Obama was born in Hawaii",
        expectedPatterns: {
          shouldContain: ['Q76', 'P569'],
          shouldNotBeEmpty: true,
          maxAmbiguousItems: 2
        }
      },
      {
        name: "Single entity",
        input: "Barack Obama",
        expectedPatterns: {
          shouldContain: ['Q76'],
          shouldNotBeEmpty: true,
          maxAmbiguousItems: 1
        }
      },
      {
        name: "Empty input",
        input: "",
        expectedPatterns: {
          shouldBeEmpty: true
        }
      },
      {
        name: "Stop words only",
        input: "the and or but",
        expectedPatterns: {
          shouldBeEmpty: true
        }
      },
      {
        name: "Hawaii disambiguation",
        input: "Hawaii",
        expectedPatterns: {
          shouldContain: ['[', 'or'],
          shouldNotBeEmpty: true,
          maxAmbiguousItems: 1
        }
      }
    ];
  }

  async runAllTests() {
    console.log('🧪 Starting Text to Q/P Transformer Tests...\n');
    
    let passedTests = 0;
    let totalTests = this.testCases.length;
    
    for (const testCase of this.testCases) {
      try {
        const result = await this.runTest(testCase);
        if (result.passed) {
          passedTests++;
          console.log(`✅ ${testCase.name}: PASSED`);
        } else {
          console.log(`❌ ${testCase.name}: FAILED`);
          console.log(`   Reason: ${result.reason}`);
        }
        console.log(`   Input: "${testCase.input}"`);
        console.log(`   Output: "${result.output}"`);
        console.log(`   Tokens: [${result.tokens.join(', ')}]`);
        console.log('');
      } catch (error) {
        console.log(`💥 ${testCase.name}: ERROR`);
        console.log(`   Error: ${error.message}`);
        console.log('');
      }
    }
    
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    return {
      passed: passedTests,
      total: totalTests,
      successRate: (passedTests / totalTests) * 100
    };
  }

  async runTest(testCase) {
    const options = {
      maxCandidates: 3,
      includeLabels: false,
      searchLimit: 10,
      preferProperties: false
    };

    const result = await this.transformer.transform(testCase.input, options);
    
    const validation = this.validateResult(result, testCase.expectedPatterns);
    
    return {
      passed: validation.passed,
      reason: validation.reason,
      output: result.formatted,
      tokens: result.tokens,
      result: result
    };
  }

  validateResult(result, expectedPatterns) {
    const output = result.formatted;
    const sequence = result.sequence;
    
    if (expectedPatterns.shouldBeEmpty) {
      if (output === '' || sequence.length === 0) {
        return { passed: true, reason: 'Output is empty as expected' };
      } else {
        return { passed: false, reason: `Expected empty output, but got: "${output}"` };
      }
    }
    
    if (expectedPatterns.shouldNotBeEmpty) {
      if (output === '' || sequence.length === 0) {
        return { passed: false, reason: 'Expected non-empty output, but got empty result' };
      }
    }
    
    if (expectedPatterns.shouldContain) {
      for (const pattern of expectedPatterns.shouldContain) {
        if (!output.includes(pattern)) {
          return { passed: false, reason: `Expected output to contain "${pattern}", but it didn't` };
        }
      }
    }
    
    if (expectedPatterns.maxAmbiguousItems !== undefined) {
      const ambiguousCount = sequence.filter(item => 
        item && item.type === 'ambiguous'
      ).length;
      
      if (ambiguousCount > expectedPatterns.maxAmbiguousItems) {
        return { 
          passed: false, 
          reason: `Too many ambiguous items: ${ambiguousCount} > ${expectedPatterns.maxAmbiguousItems}` 
        };
      }
    }
    
    return { passed: true, reason: 'All validations passed' };
  }

  async demonstrateExamples() {
    console.log('🚀 Demonstrating Text to Q/P Transformer Examples...\n');
    
    const examples = [
      "Barack Obama was born in Hawaii",
      "Barack Obama",
      "Hawaii",
      "Albert Einstein"
    ];
    
    for (const example of examples) {
      console.log(`Input: "${example}"`);
      try {
        const result = await this.transformer.transform(example, { 
          maxCandidates: 3, 
          includeLabels: false 
        });
        console.log(`Output: ${result.formatted}`);
        console.log(`Tokens: [${result.tokens.join(', ')}]`);
        console.log(`Sequence items: ${result.sequence.length}`);
        
        if (result.sequence.length > 0) {
          console.log('Detailed sequence:');
          result.sequence.forEach((item, i) => {
            if (item) {
              console.log(`  ${i + 1}. ${item.id} (${item.type})`);
              if (item.alternatives && item.alternatives.length > 0) {
                console.log(`     Alternatives: ${item.alternatives.map(a => a.id).join(', ')}`);
              }
            }
          });
        }
      } catch (error) {
        console.log(`Error: ${error.message}`);
      }
      console.log('');
    }
  }
}

// Main execution
async function main() {
  console.log('🔄 Text to Wikidata Q/P Transformer Test Suite\n');
  console.log('Using mock Wikidata API for reliable testing\n');
  
  const testSuite = new TextTransformerTest();
  
  // Run demonstration
  await testSuite.demonstrateExamples();
  
  // Run all tests
  const results = await testSuite.runAllTests();
  
  console.log('\n🎯 Key Features Demonstrated:');
  console.log('✓ Text tokenization and parsing');
  console.log('✓ Entity and property identification');
  console.log('✓ Disambiguation with [Q1 or Q2 or Q3] syntax');
  console.log('✓ Stop word filtering');
  console.log('✓ Multi-word phrase handling');
  
  if (results.successRate === 100) {
    console.log('\n🎉 All tests passed! The transformer is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run the tests
main().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});