// Automated test for Text to Wikidata Q/P Transformer

import { TextToQPTransformer } from './text-to-qp-transformer.js';

/**
 * Test suite for the Text to Q/P Transformer
 */
class TextTransformerTest {
  constructor() {
    this.transformer = new TextToQPTransformer();
    this.testCases = [
      {
        name: "Barack Obama birthplace example",
        input: "Barack Obama was born in Hawaii",
        expectedPatterns: {
          shouldContain: ['Q76', 'P569'], // Barack Obama and birth property
          shouldNotBeEmpty: true,
          maxAmbiguousItems: 2
        }
      },
      {
        name: "N-gram test: Barack Obama as single entity",
        input: "Barack Obama visited the White House",
        options: { maxNgramSize: 3 },
        expectedPatterns: {
          shouldContain: ['Q76'], // Barack Obama as single entity
          shouldNotBeEmpty: true,
          maxSequenceLength: 3 // Should match "Barack Obama" as one, not two separate
        }
      },
      {
        name: "Scientific discovery",
        input: "Albert Einstein discovered the theory of relativity",
        expectedPatterns: {
          shouldContain: ['Q937'], // Albert Einstein
          shouldNotBeEmpty: true,
          maxAmbiguousItems: 3
        }
      },
      {
        name: "Capital city relation",
        input: "Paris is the capital of France",
        expectedPatterns: {
          shouldContain: ['Q90'], // Paris
          shouldNotBeEmpty: true,
          maxAmbiguousItems: 2
        }
      },
      {
        name: "Single entity",
        input: "Barack Obama",
        expectedPatterns: {
          shouldContain: ['Q76'], // Barack Obama
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
        name: "Common words only",
        input: "the and or but",
        expectedPatterns: {
          shouldBeEmpty: true // Stop words should be filtered out
        }
      },
      {
        name: "N-gram priority test: Theory of Relativity",
        input: "theory of relativity",
        options: { maxNgramSize: 3 },
        expectedPatterns: {
          shouldNotBeEmpty: true,
          maxSequenceLength: 1 // Should match as one concept, not three words
        }
      },
      {
        name: "N-gram with different sizes",
        input: "United States of America president Barack Obama",
        options: { maxNgramSize: 4 },
        expectedPatterns: {
          shouldContain: ['Q30', 'Q76'], // USA and Barack Obama
          shouldNotBeEmpty: true,
          maxSequenceLength: 3 // USA, president/property, Barack Obama
        }
      }
    ];
  }

  /**
   * Run all tests
   */
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
        console.log(`   Sequence length: ${result.sequenceLength}`);
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

  /**
   * Run a single test case
   */
  async runTest(testCase) {
    const options = {
      maxCandidates: 3,
      includeLabels: false,
      searchLimit: 10,
      preferProperties: false,
      maxNgramSize: 3, // Default n-gram size
      ...testCase.options // Override with test-specific options
    };

    const result = await this.transformer.transform(testCase.input, options);
    
    const output = result.formatted;
    const sequence = result.sequence;
    const tokens = result.tokens;
    
    // Validate expectations
    const validation = this.validateResult(result, testCase.expectedPatterns);
    
    return {
      passed: validation.passed,
      reason: validation.reason,
      output: output,
      sequenceLength: sequence.length,
      tokensLength: tokens.length,
      result: result
    };
  }

  /**
   * Validate test result against expected patterns
   */
  validateResult(result, expectedPatterns) {
    const output = result.formatted;
    const sequence = result.sequence;
    
    // Check if should be empty
    if (expectedPatterns.shouldBeEmpty) {
      if (output === '' || sequence.length === 0) {
        return { passed: true, reason: 'Output is empty as expected' };
      } else {
        return { passed: false, reason: `Expected empty output, but got: "${output}"` };
      }
    }
    
    // Check if should not be empty
    if (expectedPatterns.shouldNotBeEmpty) {
      if (output === '' || sequence.length === 0) {
        return { passed: false, reason: 'Expected non-empty output, but got empty result' };
      }
    }
    
    // Check for required patterns
    if (expectedPatterns.shouldContain) {
      for (const pattern of expectedPatterns.shouldContain) {
        if (!output.includes(pattern)) {
          return { passed: false, reason: `Expected output to contain "${pattern}", but it didn't` };
        }
      }
    }
    
    // Check for forbidden patterns
    if (expectedPatterns.shouldNotContain) {
      for (const pattern of expectedPatterns.shouldNotContain) {
        if (output.includes(pattern)) {
          return { passed: false, reason: `Expected output to NOT contain "${pattern}", but it did` };
        }
      }
    }
    
    // Check ambiguous items count
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
    
    // Check maximum sequence length
    if (expectedPatterns.maxSequenceLength !== undefined) {
      if (sequence.length > expectedPatterns.maxSequenceLength) {
        return {
          passed: false,
          reason: `Sequence too long: ${sequence.length} > ${expectedPatterns.maxSequenceLength}`
        };
      }
    }
    
    return { passed: true, reason: 'All validations passed' };
  }

  /**
   * Test specific functionality
   */
  async testSpecificFeatures() {
    console.log('🔧 Testing Specific Features...\n');
    
    // Test 1: Disambiguation syntax
    console.log('Test: Disambiguation syntax format');
    const result = await this.transformer.transform("Hawaii", { maxCandidates: 3 });
    if (result.formatted.includes('[') && result.formatted.includes(' or ')) {
      console.log('✅ Disambiguation syntax working correctly');
    } else {
      console.log('❌ Disambiguation syntax not working as expected');
    }
    console.log(`   Result: ${result.formatted}\n`);
    
    // Test 2: Multi-word phrases
    console.log('Test: Multi-word phrase detection');
    const multiWordResult = await this.transformer.transform("Albert Einstein", { maxCandidates: 1 });
    if (multiWordResult.sequence.length === 1) {
      console.log('✅ Multi-word phrases handled correctly');
    } else {
      console.log('❌ Multi-word phrases not handled correctly');
    }
    console.log(`   Result: ${multiWordResult.formatted}\n`);
    
    // Test 3: Stop words filtering
    console.log('Test: Stop words filtering');
    const stopWordsResult = await this.transformer.transform("the and or", {});
    if (stopWordsResult.formatted === '') {
      console.log('✅ Stop words filtered correctly');
    } else {
      console.log('❌ Stop words not filtered correctly');
    }
    console.log(`   Result: "${stopWordsResult.formatted}"\n`);
    
    // Test 4: Property detection
    console.log('Test: Property detection');
    const propertyResult = await this.transformer.transform("born in", { preferProperties: true });
    const hasProperty = propertyResult.sequence.some(item => 
      item && item.type === 'property'
    );
    if (hasProperty || propertyResult.formatted.includes('P')) {
      console.log('✅ Property detection working');
    } else {
      console.log('❌ Property detection needs improvement');
    }
    console.log(`   Result: ${propertyResult.formatted}\n`);
    
    // Test 5: N-gram priority
    console.log('Test: N-gram priority (longest match first)');
    const ngramResult1 = await this.transformer.transform("Barack Obama", { maxNgramSize: 2 });
    const ngramResult2 = await this.transformer.transform("Barack Obama", { maxNgramSize: 1 });
    console.log(`   With maxNgramSize=2: ${ngramResult1.formatted} (${ngramResult1.sequence.length} items)`);
    console.log(`   With maxNgramSize=1: ${ngramResult2.formatted} (${ngramResult2.sequence.length} items)`);
    if (ngramResult1.sequence.length < ngramResult2.sequence.length) {
      console.log('✅ N-gram priority working correctly');
    } else {
      console.log('❌ N-gram priority not working as expected');
    }
    console.log('');
    
    // Test 6: Complex phrase matching
    console.log('Test: Complex phrase matching');
    const complexResult = await this.transformer.transform("United Nations Secretary General", { maxNgramSize: 4 });
    console.log(`   Result: ${complexResult.formatted}`);
    console.log(`   Sequence length: ${complexResult.sequence.length}`);
    if (complexResult.sequence.length <= 2) {
      console.log('✅ Complex phrases matched as units');
    } else {
      console.log('⚠️ Complex phrases might be over-segmented');
    }
    console.log('');
  }

  /**
   * Performance test
   */
  async testPerformance() {
    console.log('⏱️ Performance Test...\n');
    
    const testText = "Barack Obama was born in Hawaii and became the President of the United States";
    const iterations = 3;
    
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await this.transformer.transform(testText, { maxCandidates: 2 });
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;
    
    console.log(`Average transformation time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime < 5000) { // 5 seconds
      console.log('✅ Performance is acceptable');
    } else {
      console.log('⚠️ Performance might need optimization');
    }
    
    return avgTime;
  }
}

/**
 * Demo function to showcase the transformer
 */
async function demonstrateTransformer() {
  console.log('🚀 Demonstrating Text to Q/P Transformer...\n');
  
  const transformer = new TextToQPTransformer();
  
  const examples = [
    "Barack Obama was born in Hawaii",
    "Paris is the capital of France",
    "Shakespeare wrote Romeo and Juliet",
    "Einstein discovered relativity"
  ];
  
  for (const example of examples) {
    console.log(`Input: "${example}"`);
    try {
      const result = await transformer.transform(example, { 
        maxCandidates: 3, 
        includeLabels: false 
      });
      console.log(`Output: ${result.formatted}`);
      console.log(`Tokens: ${result.tokens.join(', ')}`);
      console.log(`Sequence items: ${result.sequence.length}`);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
    console.log('');
  }
}

// Export for use in HTML or other modules
export { TextTransformerTest, demonstrateTransformer };

// Auto-run if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  console.log('Running in Node.js environment - tests would run here');
} else {
  // Browser environment - make functions available globally
  window.TextTransformerTest = TextTransformerTest;
  window.demonstrateTransformer = demonstrateTransformer;
  
  // Auto-run demo
  window.runTransformerTests = async () => {
    const testSuite = new TextTransformerTest();
    await testSuite.runAllTests();
    await testSuite.testSpecificFeatures();
    await testSuite.testPerformance();
  };
  
  console.log('Text Transformer Test Suite loaded! Run runTransformerTests() to execute.');
}