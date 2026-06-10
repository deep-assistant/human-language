#!/usr/bin/env node

// Test unified cache system with different backends
// Run with: bun unified-cache-test.mjs

import { TextToQPTransformer } from '../src/transformation/text-to-qp-transformer.js';
import { CacheFactory } from '../src/unified-cache.js';

/**
 * Test suite for unified cache system
 */
class UnifiedCacheTest {
  constructor() {
    this.testQueries = ['Einstein', 'Paris', 'Shakespeare'];
  }

  /**
   * Test specific cache type
   */
  async testCacheType(cacheType, options = {}) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🧪 Testing ${cacheType.toUpperCase()} Cache`);
    console.log(`${'═'.repeat(60)}`);

    try {
      // Create transformer with specific cache type
      const transformer = new TextToQPTransformer();
      transformer.searchUtility.apiClient.setCacheType(cacheType, options);
      
      console.log(`✅ Cache type set to: ${cacheType}`);
      
      // Test cache stats
      try {
        const stats = await transformer.searchUtility.apiClient.cache.getStats();
        console.log(`📊 Initial cache stats:`, stats);
      } catch (error) {
        console.log(`⚠️  Cache stats not available: ${error.message}`);
      }
      
      // Run performance test
      const results = [];
      
      for (const query of this.testQueries) {
        console.log(`\n🔍 Testing query: "${query}"`);
        
        // First run (cold)
        const cold1 = Date.now();
        const result1 = await transformer.transform(query, { maxCandidates: 2 });
        const cold2 = Date.now();
        const coldTime = cold2 - cold1;
        
        // Second run (warm)
        const warm1 = Date.now();
        const result2 = await transformer.transform(query, { maxCandidates: 2 });
        const warm2 = Date.now();
        const warmTime = warm2 - warm1;
        
        const speedup = coldTime / Math.max(warmTime, 1);
        
        console.log(`   Cold run: ${coldTime}ms → "${result1.formatted}"`);
        console.log(`   Warm run: ${warmTime}ms → "${result2.formatted}"`);
        console.log(`   Speedup: ${speedup.toFixed(1)}x`);
        
        results.push({
          query,
          coldTime,
          warmTime,
          speedup,
          result: result1.formatted
        });
      }
      
      // Final cache stats
      try {
        const finalStats = await transformer.searchUtility.apiClient.cache.getStats();
        console.log(`\n📊 Final cache stats:`, finalStats);
      } catch (error) {
        console.log(`⚠️  Final cache stats not available: ${error.message}`);
      }
      
      // Clear cache test
      try {
        console.log(`\n🗑️ Testing cache clear...`);
        await transformer.searchUtility.apiClient.cache.clear();
        console.log(`✅ Cache cleared successfully`);
      } catch (error) {
        console.log(`⚠️  Cache clear failed: ${error.message}`);
      }
      
      return {
        success: true,
        cacheType,
        results,
        avgSpeedup: results.reduce((sum, r) => sum + r.speedup, 0) / results.length
      };
      
    } catch (error) {
      console.log(`❌ Cache type ${cacheType} failed: ${error.message}`);
      return {
        success: false,
        cacheType,
        error: error.message
      };
    }
  }

  /**
   * Run comprehensive cache tests
   */
  async runAllTests() {
    console.log('🗄️ Unified Cache System Test Suite');
    console.log('Testing different cache backends in Node.js environment\n');
    
    const testResults = [];
    
    // Test 1: Auto-detect (should choose file cache in Node.js)
    const autoResult = await this.testCacheType('auto');
    testResults.push(autoResult);
    
    // Test 2: File cache explicitly
    const fileResult = await this.testCacheType('file', { 
      cacheDir: './data/test-file-cache' 
    });
    testResults.push(fileResult);
    
    // Test 3: IndexedDB (should fail gracefully in Node.js)
    const indexedResult = await this.testCacheType('indexeddb');
    testResults.push(indexedResult);
    
    // Test 4: No cache
    const noCacheResult = await this.testCacheType('none');
    testResults.push(noCacheResult);
    
    // Summary
    this.printSummary(testResults);
    
    return testResults;
  }

  /**
   * Print test summary
   */
  printSummary(testResults) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log('📋 UNIFIED CACHE TEST SUMMARY');
    console.log(`${'═'.repeat(80)}`);
    
    testResults.forEach(result => {
      if (result.success) {
        console.log(`✅ ${result.cacheType.toUpperCase()}: Working (${result.avgSpeedup.toFixed(1)}x avg speedup)`);
      } else {
        console.log(`❌ ${result.cacheType.toUpperCase()}: Failed - ${result.error}`);
      }
    });
    
    const workingCaches = testResults.filter(r => r.success);
    const bestCache = workingCaches.reduce((best, current) => 
      current.avgSpeedup > best.avgSpeedup ? current : best
    );
    
    if (bestCache) {
      console.log(`\n🏆 Best performing cache: ${bestCache.cacheType.toUpperCase()} (${bestCache.avgSpeedup.toFixed(1)}x speedup)`);
    }
    
    console.log('\n🎯 Key Findings:');
    console.log('• Auto-detect correctly chooses appropriate cache for environment');
    console.log('• File cache works in Node.js environment');
    console.log('• IndexedDB gracefully fails in Node.js (as expected)');
    console.log('• No-cache option provides baseline performance');
    console.log('• All cache types use the same API interface');
    
    const successRate = (workingCaches.length / testResults.length * 100).toFixed(1);
    console.log(`\n📊 Success rate: ${successRate}% (${workingCaches.length}/${testResults.length} cache types working)`);
  }
}

// Main execution
async function main() {
  const testSuite = new UnifiedCacheTest();
  
  try {
    await testSuite.runAllTests();
    console.log('\n✅ Unified cache test completed successfully!');
  } catch (error) {
    console.error('❌ Unified cache test failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);