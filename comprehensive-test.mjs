#!/usr/bin/env node

// Comprehensive test suite to find transformer limitations
// Run with: bun comprehensive-test.mjs

import { TextToQPTransformer } from './text-to-qp-transformer.js';

/**
 * Comprehensive Test Suite to identify transformer limitations
 */
class ComprehensiveTransformerTest {
  constructor() {
    this.transformer = new TextToQPTransformer();
    this.failures = [];
    this.limitations = [];
    
    this.testCategories = {
      // Test cases that should work well
      basic: [
        "Einstein discovered relativity",
        "Shakespeare wrote Hamlet", 
        "Paris is in France",
        "Mozart composed symphonies",
        "Picasso painted Guernica"
      ],
      
      // Complex sentences that might challenge the transformer
      complex: [
        "Albert Einstein, who was born in Germany, developed the theory of special relativity in 1905",
        "The capital city of France, which is Paris, has a population of over 2 million people",
        "William Shakespeare, the famous English playwright, wrote Romeo and Juliet during the Elizabethan era",
        "Leonardo da Vinci painted the Mona Lisa and also invented various mechanical devices",
        "Marie Curie was the first woman to win a Nobel Prize and discovered radium"
      ],
      
      // Temporal expressions
      temporal: [
        "World War II ended in 1945",
        "The iPhone was released in 2007", 
        "Barack Obama was president from 2009 to 2017",
        "The Berlin Wall fell on November 9, 1989",
        "Neil Armstrong landed on the moon in July 1969"
      ],
      
      // Numbers and quantities
      numerical: [
        "Mount Everest is 8848 meters tall",
        "The speed of light is 299792458 meters per second",
        "Earth has one moon",
        "A triangle has three sides",
        "Water boils at 100 degrees Celsius"
      ],
      
      // Relationships and connections
      relationships: [
        "John is the father of Mary",
        "London is the capital of England", 
        "Microsoft was founded by Bill Gates",
        "The Beatles included John Lennon",
        "iPhone is manufactured by Apple"
      ],
      
      // Abstract concepts
      abstract: [
        "Democracy is a form of government",
        "Love is a strong emotion",
        "Mathematics is the study of numbers",
        "Art expresses creativity",
        "Science seeks understanding"
      ],
      
      // Negations
      negations: [
        "Einstein did not discover gravity",
        "Shakespeare was not born in France", 
        "Paris is not the capital of Germany",
        "The moon is not made of cheese",
        "Fish cannot fly"
      ],
      
      // Questions
      questions: [
        "Who discovered America?",
        "What is the capital of Japan?",
        "When was World War II?",
        "Where is the Eiffel Tower?",
        "How fast is light?"
      ],
      
      // Ambiguous terms
      ambiguous: [
        "Apple makes computers",  // Apple company vs fruit
        "Turkey is in Europe",    // Country vs bird
        "Washington was president", // George Washington vs state
        "Mercury is toxic",       // Element vs planet
        "Victoria ruled Britain"  // Queen vs other Victorias
      ],
      
      // Modern/recent entities
      modern: [
        "Elon Musk founded SpaceX",
        "COVID-19 started in 2020",
        "TikTok is popular among teens",
        "Zoom became essential during lockdown",
        "ChatGPT was released by OpenAI"
      ],
      
      // Non-English names/terms
      foreign: [
        "München is in Deutschland",
        "Tokyo is in 日本",
        "Москва is the capital of Russia",
        "François Mitterrand was French president",
        "José lives in España"
      ],
      
      // Scientific terms
      scientific: [
        "DNA contains genetic information",
        "Photosynthesis converts light to energy",
        "Quantum mechanics describes subatomic particles",
        "Black holes bend spacetime",
        "Evolution explains species diversity"
      ],
      
      // Edge cases that might break the transformer
      edge_cases: [
        "",  // Empty string
        "a",  // Single letter
        "The the the the",  // Repeated stop words
        "123 456 789",  // Only numbers
        "!@#$%^&*()",  // Only symbols
        "asdkfjlaksjdflkajsdlkfj",  // Nonsense word
        "Barack Obama Barack Obama Barack Obama",  // Repeated entities
        "COVID-19 SARS-CoV-2 pandemic coronavirus",  // Multiple terms for same concept
        "iPhone 15 Pro Max Ultra Super Deluxe",  // Non-existent entity with modifiers
        "The quick brown fox jumps over the lazy dog but then realizes it forgot its homework"  // Very long sentence
      ]
    };
  }

  /**
   * Run comprehensive tests across all categories
   */
  async runComprehensiveTests() {
    console.log('🔬 Running Comprehensive Transformer Tests...\n');
    console.log('🎯 Goal: Identify limitations and failure modes\n');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    for (const [category, testCases] of Object.entries(this.testCategories)) {
      console.log(`\n📂 Category: ${category.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      for (const testCase of testCases) {
        totalTests++;
        
        try {
          const result = await this.testSingleCase(testCase, category);
          
          if (result.success) {
            passedTests++;
            console.log(`✅ "${testCase}"`);
            console.log(`   → ${result.output}`);
          } else {
            failedTests++;
            console.log(`❌ "${testCase}"`);
            console.log(`   → ${result.error || 'No output produced'}`);
            console.log(`   → Reason: ${result.reason}`);
            
            this.failures.push({
              category: category,
              input: testCase,
              error: result.error,
              reason: result.reason,
              output: result.output
            });
          }
          
          if (result.limitations && result.limitations.length > 0) {
            this.limitations.push({
              category: category,
              input: testCase,
              limitations: result.limitations
            });
          }
          
        } catch (error) {
          failedTests++;
          console.log(`💥 "${testCase}"`);
          console.log(`   → Error: ${error.message}`);
          
          this.failures.push({
            category: category,
            input: testCase,
            error: error.message,
            reason: 'Exception thrown'
          });
        }
        
        // Brief pause to avoid overwhelming the API
        await this.sleep(100);
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log(`📊 COMPREHENSIVE TEST RESULTS`);
    console.log('═'.repeat(80));
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
    
    this.analyzeFailures();
    this.analyzeLimitations();
    this.generateRecommendations();
    
    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      failures: this.failures,
      limitations: this.limitations
    };
  }

  /**
   * Test a single case and analyze results
   */
  async testSingleCase(input, category) {
    const startTime = Date.now();
    
    try {
      const result = await this.transformer.transform(input, {
        maxCandidates: 3,
        includeLabels: false,
        searchLimit: 10
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Analyze the result
      const analysis = this.analyzeResult(result, input, category, duration);
      
      return {
        success: analysis.success,
        output: result.formatted,
        duration: duration,
        limitations: analysis.limitations,
        reason: analysis.reason,
        sequenceLength: result.sequence.length,
        tokenCount: result.tokens.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        reason: 'API or processing error'
      };
    }
  }

  /**
   * Analyze individual test results
   */
  analyzeResult(result, input, category, duration) {
    const limitations = [];
    let success = true;
    let reason = '';
    
    // Check for basic success criteria
    if (!result.formatted || result.formatted.trim() === '') {
      success = false;
      reason = 'No output produced';
      return { success, reason, limitations };
    }
    
    // Category-specific analysis
    switch (category) {
      case 'edge_cases':
        if (input === '' && result.formatted !== '') {
          limitations.push('Empty input should produce empty output');
        }
        if (input.match(/^\d+[\s\d]*$/) && result.sequence.length > 0) {
          limitations.push('Numbers-only input produced unexpected results');
        }
        if (input.match(/^[^\w\s]+$/) && result.sequence.length > 0) {
          limitations.push('Symbols-only input produced unexpected results');
        }
        break;
        
      case 'questions':
        // Questions should be handled differently or not at all
        if (result.sequence.length > 0) {
          limitations.push('Questions treated as statements - may need special handling');
        }
        break;
        
      case 'negations':
        // Negations are complex - current implementation ignores "not"
        limitations.push('Negations not properly handled - "not" is treated as stop word');
        break;
        
      case 'temporal':
        // Check if dates/numbers are handled
        const hasDateNumbers = input.match(/\d{4}/); // Years
        if (hasDateNumbers && !result.formatted.includes('P')) {
          limitations.push('Temporal expressions may not identify time-related properties');
        }
        break;
        
      case 'numerical':
        // Check if quantities are handled
        const hasNumbers = input.match(/\d+/);
        if (hasNumbers && result.sequence.length === 0) {
          limitations.push('Numerical values not processed');
        }
        break;
        
      case 'foreign':
        // Non-English terms might not be found
        if (result.sequence.length === 0) {
          limitations.push('Non-English terms not recognized');
        }
        break;
        
      case 'abstract':
        // Abstract concepts might be harder to find
        if (result.sequence.length === 0) {
          limitations.push('Abstract concepts not found in Wikidata');
        }
        break;
        
      case 'modern':
        // Recent entities might not be in Wikidata yet
        if (result.sequence.length === 0) {
          limitations.push('Very recent entities may not be in Wikidata');
        }
        break;
    }
    
    // Performance analysis
    if (duration > 10000) { // 10 seconds
      limitations.push(`Slow processing: ${duration}ms`);
    }
    
    // Check for overly long sequences (might indicate poor disambiguation)
    if (result.sequence.length > 10) {
      limitations.push(`Sequence too long: ${result.sequence.length} items`);
    }
    
    // Check for all-ambiguous results
    const ambiguousCount = result.sequence.filter(item => 
      item && item.type === 'ambiguous'
    ).length;
    
    if (ambiguousCount === result.sequence.length && result.sequence.length > 0) {
      limitations.push('All results are ambiguous - no confident matches');
    }
    
    return { success, reason: 'Analysis complete', limitations };
  }

  /**
   * Analyze failure patterns
   */
  analyzeFailures() {
    if (this.failures.length === 0) {
      console.log('\n🎉 No failures detected!');
      return;
    }
    
    console.log(`\n❌ FAILURE ANALYSIS (${this.failures.length} failures)`);
    console.log('─'.repeat(50));
    
    // Group failures by category
    const failuresByCategory = {};
    this.failures.forEach(failure => {
      if (!failuresByCategory[failure.category]) {
        failuresByCategory[failure.category] = [];
      }
      failuresByCategory[failure.category].push(failure);
    });
    
    for (const [category, failures] of Object.entries(failuresByCategory)) {
      console.log(`\n${category.toUpperCase()}: ${failures.length} failures`);
      failures.forEach(failure => {
        console.log(`  • "${failure.input}": ${failure.reason}`);
      });
    }
    
    // Identify common failure reasons
    const reasonCounts = {};
    this.failures.forEach(failure => {
      reasonCounts[failure.reason] = (reasonCounts[failure.reason] || 0) + 1;
    });
    
    console.log('\nMost common failure reasons:');
    Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([reason, count]) => {
        console.log(`  ${count}x: ${reason}`);
      });
  }

  /**
   * Analyze limitations and patterns
   */
  analyzeLimitations() {
    if (this.limitations.length === 0) {
      console.log('\n✨ No significant limitations detected!');
      return;
    }
    
    console.log(`\n⚠️  LIMITATION ANALYSIS (${this.limitations.length} cases)`);
    console.log('─'.repeat(50));
    
    // Collect all limitation types
    const allLimitations = [];
    this.limitations.forEach(item => {
      allLimitations.push(...item.limitations);
    });
    
    // Count limitation frequency
    const limitationCounts = {};
    allLimitations.forEach(limitation => {
      limitationCounts[limitation] = (limitationCounts[limitation] || 0) + 1;
    });
    
    console.log('Most common limitations:');
    Object.entries(limitationCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([limitation, count]) => {
        console.log(`  ${count}x: ${limitation}`);
      });
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations() {
    console.log('\n💡 IMPROVEMENT RECOMMENDATIONS');
    console.log('─'.repeat(50));
    
    const recommendations = [];
    
    // Based on failure analysis
    if (this.failures.some(f => f.reason === 'No output produced')) {
      recommendations.push('Add fallback handling for cases with no Wikidata matches');
    }
    
    // Based on limitation analysis
    const allLimitations = [];
    this.limitations.forEach(item => allLimitations.push(...item.limitations));
    
    if (allLimitations.some(l => l.includes('Negations'))) {
      recommendations.push('Implement negation handling - "not" should affect the semantic meaning');
    }
    
    if (allLimitations.some(l => l.includes('Questions'))) {
      recommendations.push('Add question detection and special handling');
    }
    
    if (allLimitations.some(l => l.includes('Temporal'))) {
      recommendations.push('Improve temporal expression recognition and date property mapping');
    }
    
    if (allLimitations.some(l => l.includes('Numerical'))) {
      recommendations.push('Add numerical value and unit recognition');
    }
    
    if (allLimitations.some(l => l.includes('Non-English'))) {
      recommendations.push('Improve multi-language support and cross-language entity linking');
    }
    
    if (allLimitations.some(l => l.includes('Abstract'))) {
      recommendations.push('Enhance abstract concept recognition in Wikidata');
    }
    
    if (allLimitations.some(l => l.includes('Slow processing'))) {
      recommendations.push('Optimize API calls and implement better caching');
    }
    
    if (allLimitations.some(l => l.includes('all results are ambiguous'))) {
      recommendations.push('Implement confidence scoring and better disambiguation algorithms');
    }
    
    if (allLimitations.some(l => l.includes('Sequence too long'))) {
      recommendations.push('Improve phrase detection to reduce over-segmentation');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System appears to be working well across all test categories!');
    }
    
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  console.log('🔄 Comprehensive Text to Q/P Transformer Analysis\n');
  
  const testSuite = new ComprehensiveTransformerTest();
  
  try {
    const results = await testSuite.runComprehensiveTests();
    
    // Save detailed results
    const fs = await import('fs');
    const detailedResults = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.total,
        passed: results.passed,
        failed: results.failed,
        successRate: ((results.passed / results.total) * 100).toFixed(1)
      },
      failures: results.failures,
      limitations: results.limitations
    };
    
    fs.writeFileSync('comprehensive-test-results.json', JSON.stringify(detailedResults, null, 2));
    console.log('\n💾 Detailed results saved to comprehensive-test-results.json');
    
    if (results.failed === 0) {
      console.log('\n🎉 All comprehensive tests passed!');
      process.exit(0);
    } else {
      console.log(`\n⚠️ Found ${results.failed} failures and limitations to address.`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Comprehensive test execution failed:', error);
    process.exit(1);
  }
}

// Run the comprehensive tests
main().catch(error => {
  console.error('Comprehensive test suite failed:', error);
  process.exit(1);
});