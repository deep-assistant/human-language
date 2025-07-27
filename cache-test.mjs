#!/usr/bin/env node

// Test the persistent cache system
// Run with: bun cache-test.mjs

import { TextToQPTransformer } from './text-to-qp-transformer.js';

async function testCache() {
  console.log('🗄️ Testing Persistent Cache System\n');
  
  const transformer = new TextToQPTransformer();
  
  const testQueries = [
    'Barack Obama',
    'Einstein', 
    'Paris',
    'Shakespeare',
    'born'
  ];
  
  console.log('First run - should make API calls and cache results:');
  console.log('─'.repeat(60));
  
  for (const query of testQueries) {
    console.log(`\nTesting: "${query}"`);
    const startTime = Date.now();
    
    try {
      const result = await transformer.transform(query, { maxCandidates: 2 });
      const endTime = Date.now();
      
      console.log(`  Result: ${result.formatted}`);
      console.log(`  Duration: ${endTime - startTime}ms`);
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('Second run - should use cached results (much faster):');
  console.log('─'.repeat(60));
  
  for (const query of testQueries) {
    console.log(`\nTesting: "${query}"`);
    const startTime = Date.now();
    
    try {
      const result = await transformer.transform(query, { maxCandidates: 2 });
      const endTime = Date.now();
      
      console.log(`  Result: ${result.formatted}`);
      console.log(`  Duration: ${endTime - startTime}ms`);
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
  
  // Get cache statistics
  console.log('\n' + '═'.repeat(60));
  console.log('Cache Statistics:');
  console.log('─'.repeat(60));
  
  try {
    const apiClient = transformer.searchUtility.apiClient;
    if (apiClient && apiClient.cache) {
      const stats = await apiClient.cache.getStats();
      console.log('Memory Cache:');
      console.log(`  Items: ${stats.memoryCache.size}/${stats.memoryCache.maxSize}`);
      console.log('\nFile Cache:');
      console.log(`  Files: ${stats.fileCache.fileCount}`);
      console.log(`  Total size: ${stats.fileCache.totalSizeMB} MB`);
      
      if (stats.fileCache.oldestFile) {
        console.log(`  Oldest file: ${stats.fileCache.oldestFile.name} (${Math.round(stats.fileCache.oldestFile.age / 1000)}s ago)`);
      }
      if (stats.fileCache.newestFile) {
        console.log(`  Newest file: ${stats.fileCache.newestFile.name} (${Math.round(stats.fileCache.newestFile.age / 1000)}s ago)`);
      }
    }
  } catch (error) {
    console.log('Failed to get cache stats:', error.message);
  }
  
  console.log('\n✅ Cache test completed!');
  console.log('💡 Check the /data folder for cached files');
}

testCache().catch(console.error);