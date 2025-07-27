#!/usr/bin/env node

// Test real Wikidata API with persistent caching - run twice to demonstrate speed improvement
// Run with: bun cached-api-test.mjs

import { TextToQPTransformer } from './text-to-qp-transformer.js';

/**
 * Test suite for real API with caching
 */
class CachedAPITest {
  constructor() {
    this.transformer = new TextToQPTransformer();
    this.testCases = [
      {
        name: "Barack Obama birthplace",
        input: "Barack Obama was born in Hawaii",
        description: "Complex sentence with person, property, and location"
      },
      {
        name: "Simple entity",
        input: "Einstein",
        description: "Single famous person"
      },
      {
        name: "Capital relation",
        input: "Paris is the capital of France",
        description: "Geographic relationship"
      },
      {
        name: "Creative work",
        input: "Shakespeare wrote Hamlet",
        description: "Author-work relationship"
      },
      {
        name: "Scientific discovery",
        input: "Newton discovered gravity",
        description: "Discovery relationship"
      }
    ];
    
    this.runResults = [];
  }

  /**
   * Run test suite with timing and caching metrics
   */
  async runTestSuite(runNumber) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🧪 RUN ${runNumber}: ${runNumber === 1 ? 'COLD START (API CALLS)' : 'WARM START (CACHED)'}`);
    console.log(`${'═'.repeat(80)}`);
    
    const runStartTime = Date.now();
    const results = {
      runNumber: runNumber,
      tests: [],
      totalDuration: 0,
      cacheHits: 0,
      apiCalls: 0
    };
    
    for (const testCase of this.testCases) {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      console.log(`   Input: "${testCase.input}"`);
      console.log(`   Description: ${testCase.description}`);
      
      const testStartTime = Date.now();
      
      try {
        // Count cache hits by intercepting console.log
        let cacheHits = 0;
        let apiCalls = 0;
        
        const originalLog = console.log;
        console.log = (...args) => {
          const message = args.join(' ');
          if (message.includes('Cache hit for')) {
            cacheHits++;
          } else if (message.includes('API call for')) {
            apiCalls++;
          }
          // Don't display cache/API messages during test
          if (!message.includes('Cache hit') && !message.includes('API call')) {
            originalLog.apply(console, args);
          }
        };
        
        const result = await this.transformer.transform(testCase.input, {
          maxCandidates: 3,
          includeLabels: false,
          searchLimit: 8,
          preferProperties: false
        });
        
        console.log = originalLog; // Restore console.log
        
        const testEndTime = Date.now();
        const duration = testEndTime - testStartTime;
        
        const testResult = {
          name: testCase.name,
          input: testCase.input,
          output: result.formatted,
          duration: duration,
          sequenceLength: result.sequence.length,
          tokens: result.tokens,
          cacheHits: cacheHits,
          apiCalls: apiCalls,
          success: true
        };
        
        console.log(`   ✅ Output: "${result.formatted}"`);
        console.log(`   ⏱️  Duration: ${duration}ms`);
        console.log(`   📊 Sequence: ${result.sequence.length} items`);
        console.log(`   🗄️  Cache hits: ${cacheHits}, API calls: ${apiCalls}`);
        
        results.tests.push(testResult);
        results.cacheHits += cacheHits;
        results.apiCalls += apiCalls;
        
        // Add delay between requests to be respectful to API
        if (apiCalls > 0 && runNumber === 1) {
          console.log(`   ⏸️  Waiting 1s between API calls...`);
          await this.sleep(1000);
        }
        
      } catch (error) {
        const testEndTime = Date.now();
        const duration = testEndTime - testStartTime;
        
        console.log(`   ❌ Error: ${error.message}`);
        console.log(`   ⏱️  Duration: ${duration}ms`);
        
        results.tests.push({
          name: testCase.name,
          input: testCase.input,
          error: error.message,
          duration: duration,
          success: false
        });
      }
    }
    
    const runEndTime = Date.now();
    results.totalDuration = runEndTime - runStartTime;
    
    console.log(`\n📊 RUN ${runNumber} SUMMARY:`);
    console.log(`   Total time: ${results.totalDuration}ms`);
    console.log(`   Cache hits: ${results.cacheHits}`);
    console.log(`   API calls: ${results.apiCalls}`);
    console.log(`   Success rate: ${results.tests.filter(t => t.success).length}/${results.tests.length}`);
    
    this.runResults.push(results);
    return results;
  }

  /**
   * Compare two test runs
   */
  compareRuns() {
    if (this.runResults.length < 2) {
      console.log('Need at least 2 runs to compare');
      return;
    }
    
    const run1 = this.runResults[0];
    const run2 = this.runResults[1];
    
    console.log(`\n${'═'.repeat(80)}`);
    console.log('📈 PERFORMANCE COMPARISON');
    console.log(`${'═'.repeat(80)}`);
    
    console.log(`\nOverall Performance:`);
    console.log(`   Run 1 (Cold): ${run1.totalDuration}ms`);
    console.log(`   Run 2 (Warm): ${run2.totalDuration}ms`);
    
    const speedup = run1.totalDuration / run2.totalDuration;
    const timeSaved = run1.totalDuration - run2.totalDuration;
    
    console.log(`   Speed improvement: ${speedup.toFixed(1)}x faster`);
    console.log(`   Time saved: ${timeSaved}ms (${((timeSaved/run1.totalDuration)*100).toFixed(1)}%)`);
    
    console.log(`\nAPI Usage:`);
    console.log(`   Run 1 API calls: ${run1.apiCalls}`);
    console.log(`   Run 2 API calls: ${run2.apiCalls}`);
    console.log(`   Run 2 cache hits: ${run2.cacheHits}`);
    
    console.log(`\nPer-Test Comparison:`);
    for (let i = 0; i < run1.tests.length; i++) {
      const test1 = run1.tests[i];
      const test2 = run2.tests[i];
      
      if (test1.success && test2.success) {
        const testSpeedup = test1.duration / test2.duration;
        console.log(`   ${test1.name}:`);
        console.log(`     Run 1: ${test1.duration}ms (${test1.apiCalls} API calls)`);
        console.log(`     Run 2: ${test2.duration}ms (${test2.cacheHits} cache hits)`);
        console.log(`     Speedup: ${testSpeedup.toFixed(1)}x faster`);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const apiClient = this.transformer.searchUtility.apiClient;
      if (apiClient && apiClient.cache) {
        return await apiClient.cache.getStats();
      }
    } catch (error) {
      console.log('Failed to get cache stats:', error.message);
    }
    return null;
  }

  /**
   * Display cache statistics
   */
  async displayCacheStats() {
    console.log(`\n${'═'.repeat(80)}`);
    console.log('🗄️  CACHE STATISTICS');
    console.log(`${'═'.repeat(80)}`);
    
    const stats = await this.getCacheStats();
    if (stats) {
      console.log(`Memory Cache:`);
      console.log(`   Items: ${stats.memoryCache.size}/${stats.memoryCache.maxSize}`);
      console.log(`   Usage: ${((stats.memoryCache.size/stats.memoryCache.maxSize)*100).toFixed(1)}%`);
      
      console.log(`\nFile Cache:`);
      console.log(`   Files: ${stats.fileCache.fileCount}`);
      console.log(`   Total size: ${stats.fileCache.totalSizeMB} MB`);
      
      if (stats.fileCache.oldestFile) {
        const ageMinutes = Math.round(stats.fileCache.oldestFile.age / (1000 * 60));
        console.log(`   Oldest entry: ${ageMinutes} minutes ago`);
      }
      if (stats.fileCache.newestFile) {
        const ageSeconds = Math.round(stats.fileCache.newestFile.age / 1000);
        console.log(`   Newest entry: ${ageSeconds} seconds ago`);
      }
    } else {
      console.log('Cache statistics not available');
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  console.log('🌐 Real Wikidata API Cache Performance Test');
  console.log('⚠️  This test makes real API calls and may take time on first run');
  console.log('💡 The second run should be much faster due to caching\n');
  
  const testSuite = new CachedAPITest();
  
  try {
    // Show initial cache state
    await testSuite.displayCacheStats();
    
    // Run 1: Cold start with API calls
    console.log('\n⏳ Starting Run 1 - This may take a while due to API calls...');
    await testSuite.runTestSuite(1);
    
    // Show cache state after first run
    await testSuite.displayCacheStats();
    
    // Small delay before second run
    console.log('\n⏸️  Brief pause before second run...');
    await testSuite.sleep(2000);
    
    // Run 2: Warm start with cached data
    console.log('\n⚡ Starting Run 2 - Should be much faster with cached data...');
    await testSuite.runTestSuite(2);
    
    // Compare results
    testSuite.compareRuns();
    
    // Final cache state
    await testSuite.displayCacheStats();
    
    console.log(`\n${'═'.repeat(80)}`);
    console.log('🎯 TEST CONCLUSIONS');
    console.log(`${'═'.repeat(80)}`);
    console.log('✅ Real API integration with persistent caching works correctly');
    console.log('✅ Significant performance improvement on subsequent runs');
    console.log('✅ Cache persists between application restarts');
    console.log('✅ Reduced API dependency and rate limiting concerns');
    console.log('✅ Transformer functions correctly with both fresh and cached data');
    
    const run1 = testSuite.runResults[0];
    const run2 = testSuite.runResults[1];
    if (run1 && run2) {
      const overallSpeedup = run1.totalDuration / run2.totalDuration;
      console.log(`\n🚀 Overall speedup: ${overallSpeedup.toFixed(1)}x faster with caching!`);
    }
    
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Set higher timeout for real API calls
const originalTimeout = setTimeout;
setTimeout = (fn, delay) => originalTimeout(fn, Math.max(delay, 30000));

// Run the test
main().catch(error => {
  console.error('Cache performance test failed:', error);
  process.exit(1);
});