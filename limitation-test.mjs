#!/usr/bin/env node

// Fast limitation test using mock data to identify transformer problems
// Run with: bun limitation-test.mjs

import { TextToQPTransformer } from './text-to-qp-transformer.js';

/**
 * Enhanced Mock API for testing edge cases and limitations
 */
class LimitationTestMockAPI {
  constructor() {
    this.mockData = {
      // Standard cases that work
      'Einstein': { entities: [{ id: 'Q937', label: 'Albert Einstein' }], properties: [] },
      'Shakespeare': { entities: [{ id: 'Q692', label: 'William Shakespeare' }], properties: [] },
      'Paris': { entities: [{ id: 'Q90', label: 'Paris' }], properties: [] },
      'France': { entities: [{ id: 'Q142', label: 'France' }], properties: [] },
      
      // Numbers - should typically not find entities
      '1945': { entities: [], properties: [] },
      '100': { entities: [], properties: [] },
      '8848': { entities: [], properties: [] },
      
      // Abstract concepts - may or may not be in Wikidata
      'democracy': { entities: [{ id: 'Q7174', label: 'democracy' }], properties: [] },
      'love': { entities: [{ id: 'Q316', label: 'love' }], properties: [] },
      'mathematics': { entities: [{ id: 'Q395', label: 'mathematics' }], properties: [] },
      'art': { entities: [{ id: 'Q735', label: 'art' }], properties: [] },
      'science': { entities: [{ id: 'Q336', label: 'science' }], properties: [] },
      
      // Nonsense words - should find nothing
      'asdkfjlaksjdflkajsdlkfj': { entities: [], properties: [] },
      'blahblahblah': { entities: [], properties: [] },
      
      // Ambiguous terms
      'Apple': { 
        entities: [
          { id: 'Q312', label: 'Apple', description: 'fruit' },
          { id: 'Q312', label: 'Apple Inc.', description: 'technology company' }
        ], 
        properties: [] 
      },
      'Turkey': {
        entities: [
          { id: 'Q43', label: 'Turkey', description: 'country' },
          { id: 'Q4229558', label: 'turkey', description: 'bird' }
        ],
        properties: []
      },
      
      // Properties
      'discovered': { entities: [], properties: [{ id: 'P61', label: 'discoverer or inventor' }] },
      'wrote': { entities: [], properties: [{ id: 'P50', label: 'author' }] },
      'born': { entities: [], properties: [{ id: 'P569', label: 'date of birth' }] },
      'capital': { entities: [], properties: [{ id: 'P36', label: 'capital' }] },
      
      // Modern entities - might not exist in mock
      'ChatGPT': { entities: [], properties: [] },
      'TikTok': { entities: [], properties: [] },
      'COVID-19': { entities: [{ id: 'Q84263196', label: 'COVID-19' }], properties: [] },
      
      // Foreign language terms
      'München': { entities: [{ id: 'Q1726', label: 'Munich' }], properties: [] },
      'Москва': { entities: [], properties: [] }, // Might not work in Latin script search
      '日本': { entities: [], properties: [] },
    };
  }

  async searchExactMatch(query) {
    const result = this.mockData[query] || { entities: [], properties: [] };
    return {
      entities: result.entities || [],
      properties: result.properties || [],
      total: (result.entities?.length || 0) + (result.properties?.length || 0)
    };
  }

  async searchFuzzy(query) {
    return this.searchExactMatch(query);
  }
}

class LimitationTestSearchUtility {
  constructor() {
    this.apiClient = new LimitationTestMockAPI();
  }

  async disambiguateSearch(query) {
    const exactResults = await this.apiClient.searchExactMatch(query);
    return {
      exact: [...(exactResults.entities || []), ...(exactResults.properties || [])],
      fuzzy: [],
      combined: [...(exactResults.entities || []), ...(exactResults.properties || [])],
      total: exactResults.total
    };
  }
}

class LimitationTestTransformer extends TextToQPTransformer {
  constructor() {
    super();
    this.searchUtility = new LimitationTestSearchUtility();
  }
}

/**
 * Fast limitation test suite
 */
class LimitationTest {
  constructor() {
    this.transformer = new LimitationTestTransformer();
    this.failures = [];
    this.issues = [];
    
    this.testCases = [
      // Edge cases that should reveal problems
      { name: "Empty string", input: "", expected: "empty" },
      { name: "Single letter", input: "a", expected: "empty" },
      { name: "Only stop words", input: "the and or but", expected: "empty" },
      { name: "Only numbers", input: "123 456 789", expected: "empty" },
      { name: "Only symbols", input: "!@#$%^&*()", expected: "empty" },
      { name: "Nonsense word", input: "asdkfjlaksjdflkajsdlkfj", expected: "empty" },
      
      // Negations - current system ignores "not"
      { name: "Simple negation", input: "Einstein did not discover gravity", expected: "should_handle_negation" },
      { name: "Negative statement", input: "Paris is not in Germany", expected: "should_handle_negation" },
      
      // Questions - treated as statements
      { name: "Who question", input: "Who discovered America?", expected: "should_handle_questions" },
      { name: "What question", input: "What is the capital of Japan?", expected: "should_handle_questions" },
      { name: "When question", input: "When was Einstein born?", expected: "should_handle_questions" },
      
      // Complex sentences with multiple clauses
      { name: "Complex sentence", input: "Einstein, who was born in Germany, discovered relativity", expected: "complex" },
      { name: "Multiple facts", input: "Paris is the capital of France and has the Eiffel Tower", expected: "complex" },
      
      // Temporal expressions with dates
      { name: "Year only", input: "1945", expected: "temporal" },
      { name: "Date statement", input: "World War II ended in 1945", expected: "temporal" },
      { name: "Period statement", input: "Obama was president from 2009 to 2017", expected: "temporal" },
      
      // Quantities and measurements
      { name: "Height measurement", input: "Mount Everest is 8848 meters tall", expected: "numerical" },
      { name: "Speed measurement", input: "Speed of light is 299792458 meters per second", expected: "numerical" },
      
      // Abstract concepts
      { name: "Abstract concept 1", input: "Democracy is a form of government", expected: "abstract" },
      { name: "Abstract concept 2", input: "Love is a strong emotion", expected: "abstract" },
      
      // Ambiguous terms
      { name: "Ambiguous Apple", input: "Apple makes computers", expected: "ambiguous" },
      { name: "Ambiguous Turkey", input: "Turkey is delicious", expected: "ambiguous" },
      
      // Modern entities that might not exist
      { name: "Recent entity", input: "ChatGPT answers questions", expected: "modern" },
      { name: "Social media", input: "TikTok is popular", expected: "modern" },
      
      // Non-English terms
      { name: "German city", input: "München is in Deutschland", expected: "foreign" },
      { name: "Cyrillic text", input: "Москва is the capital", expected: "foreign" },
      { name: "Japanese text", input: "Tokyo is in 日本", expected: "foreign" },
      
      // Repeated entities
      { name: "Repeated entity", input: "Obama Obama Obama", expected: "repetition" },
      { name: "Mixed repetition", input: "Paris Paris France France", expected: "repetition" },
      
      // Very long inputs
      { name: "Long sentence", input: "The quick brown fox jumps over the lazy dog but then realizes it forgot its homework and needs to go back home", expected: "long" },
      
      // Contradictions
      { name: "Contradiction", input: "Einstein discovered gravity but Newton also discovered gravity", expected: "contradiction" },
    ];
  }

  async runLimitationTests() {
    console.log('🔍 Fast Limitation Detection Test\n');
    console.log('🎯 Goal: Quickly identify transformer weaknesses\n');
    
    let totalTests = 0;
    let problemsFound = 0;
    
    for (const testCase of this.testCases) {
      totalTests++;
      console.log(`Testing: "${testCase.input}"`);
      
      try {
        const startTime = Date.now();
        const result = await this.transformer.transform(testCase.input, {
          maxCandidates: 3,
          includeLabels: false,
          searchLimit: 5
        });
        const endTime = Date.now();
        
        const analysis = this.analyzeResult(result, testCase);
        
        if (analysis.hasIssues) {
          problemsFound++;
          console.log(`  ❌ Issues found: ${analysis.issues.join(', ')}`);
          this.issues.push({
            name: testCase.name,
            input: testCase.input,
            expected: testCase.expected,
            output: result.formatted,
            issues: analysis.issues,
            duration: endTime - startTime
          });
        } else {
          console.log(`  ✅ Behaved as expected`);
        }
        
        console.log(`     Output: "${result.formatted}"`);
        console.log(`     Duration: ${endTime - startTime}ms`);
        console.log('');
        
      } catch (error) {
        problemsFound++;
        console.log(`  💥 Error: ${error.message}`);
        this.failures.push({
          name: testCase.name,
          input: testCase.input,
          error: error.message
        });
      }
    }
    
    this.generateLimitationReport(totalTests, problemsFound);
    
    return {
      total: totalTests,
      problems: problemsFound,
      issues: this.issues,
      failures: this.failures
    };
  }

  analyzeResult(result, testCase) {
    const issues = [];
    
    switch (testCase.expected) {
      case "empty":
        if (result.formatted && result.formatted.trim() !== '') {
          issues.push('Should produce empty output but produced: ' + result.formatted);
        }
        break;
        
      case "should_handle_negation":
        // Current system ignores "not" - this is a known limitation
        if (result.sequence.length > 0) {
          issues.push('Negation not properly handled - "not" should affect meaning');
        }
        break;
        
      case "should_handle_questions":
        // Questions should be handled differently
        if (result.sequence.length > 0) {
          issues.push('Questions treated as statements - need special handling');
        }
        break;
        
      case "temporal":
        // Should identify temporal properties
        const hasTimeProperty = result.formatted.includes('P');
        if (!hasTimeProperty && result.sequence.length > 0) {
          issues.push('Temporal expression not identified with time-related properties');
        }
        break;
        
      case "numerical":
        // Should handle quantities differently
        const hasQuantity = result.formatted.match(/\d/);
        if (!hasQuantity) {
          issues.push('Numerical values lost in transformation');
        }
        break;
        
      case "foreign":
        // Non-Latin scripts might not work
        if (result.sequence.length === 0 && testCase.input.match(/[^\x00-\x7F]/)) {
          issues.push('Non-Latin script terms not recognized');
        }
        break;
        
      case "modern":
        // Recent entities might not be in knowledge base
        if (result.sequence.length === 0) {
          issues.push('Recent/modern entities not found in knowledge base');
        }
        break;
        
      case "repetition":
        // Repeated entities should be deduplicated or handled specially
        if (result.sequence.length > 2) {
          issues.push('Repeated entities not properly deduplicated');
        }
        break;
        
      case "long":
        // Very long sentences might overwhelm the system
        if (result.sequence.length > 15) {
          issues.push('Long sentences produce overly complex output');
        }
        break;
    }
    
    // General issues
    if (result.sequence.length > 10) {
      issues.push('Output sequence too long - may indicate poor segmentation');
    }
    
    const allAmbiguous = result.sequence.every(item => item && item.type === 'ambiguous');
    if (allAmbiguous && result.sequence.length > 0) {
      issues.push('All results ambiguous - no confident matches');
    }
    
    return {
      hasIssues: issues.length > 0,
      issues: issues
    };
  }

  generateLimitationReport(totalTests, problemsFound) {
    console.log('═'.repeat(80));
    console.log('📋 LIMITATION ANALYSIS REPORT');
    console.log('═'.repeat(80));
    console.log(`Total tests: ${totalTests}`);
    console.log(`Problems found: ${problemsFound} (${((problemsFound/totalTests)*100).toFixed(1)}%)`);
    console.log('');
    
    if (this.failures.length > 0) {
      console.log('💥 CRITICAL FAILURES:');
      this.failures.forEach(failure => {
        console.log(`  • ${failure.name}: ${failure.error}`);
      });
      console.log('');
    }
    
    if (this.issues.length > 0) {
      console.log('⚠️  IDENTIFIED LIMITATIONS:');
      
      // Group issues by type
      const issueTypes = {};
      this.issues.forEach(issue => {
        issue.issues.forEach(issueText => {
          const type = this.categorizeIssue(issueText);
          if (!issueTypes[type]) issueTypes[type] = [];
          issueTypes[type].push({
            name: issue.name,
            input: issue.input,
            issue: issueText
          });
        });
      });
      
      Object.entries(issueTypes).forEach(([type, issues]) => {
        console.log(`\n${type}:`);
        issues.forEach(issue => {
          console.log(`  • ${issue.name}: ${issue.issue}`);
        });
      });
    }
    
    console.log('\n💡 PRIORITY IMPROVEMENTS NEEDED:');
    const improvements = [
      '1. Implement negation handling ("not", "never", etc.)',
      '2. Add question detection and special processing',
      '3. Improve temporal expression recognition',
      '4. Handle numerical values and units properly',
      '5. Add multi-language support for non-Latin scripts',
      '6. Implement entity deduplication for repeated terms',
      '7. Add confidence scoring to reduce ambiguous results',
      '8. Optimize phrase detection to reduce over-segmentation'
    ];
    
    improvements.forEach(improvement => console.log(improvement));
  }

  categorizeIssue(issueText) {
    if (issueText.includes('negation')) return 'NEGATION HANDLING';
    if (issueText.includes('question')) return 'QUESTION PROCESSING';
    if (issueText.includes('temporal') || issueText.includes('time')) return 'TEMPORAL EXPRESSIONS';
    if (issueText.includes('numerical') || issueText.includes('values')) return 'NUMERICAL VALUES';
    if (issueText.includes('script') || issueText.includes('foreign')) return 'LANGUAGE SUPPORT';
    if (issueText.includes('repeated') || issueText.includes('duplicate')) return 'DEDUPLICATION';
    if (issueText.includes('ambiguous')) return 'DISAMBIGUATION';
    if (issueText.includes('sequence') || issueText.includes('segmentation')) return 'SEGMENTATION';
    if (issueText.includes('modern') || issueText.includes('recent')) return 'KNOWLEDGE COVERAGE';
    return 'OTHER';
  }
}

// Main execution
async function main() {
  const testSuite = new LimitationTest();
  
  try {
    const results = await testSuite.runLimitationTests();
    
    // Save results
    const fs = await import('fs');
    fs.writeFileSync('limitations-found.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: results,
      details: {
        issues: testSuite.issues,
        failures: testSuite.failures
      }
    }, null, 2));
    
    console.log('\n💾 Detailed results saved to limitations-found.json');
    
    if (results.problems > 0) {
      console.log(`\n⚠️ Found ${results.problems} areas needing improvement.`);
    } else {
      console.log('\n🎉 No major limitations detected!');
    }
    
  } catch (error) {
    console.error('Limitation test failed:', error);
    process.exit(1);
  }
}

main();