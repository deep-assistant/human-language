#!/usr/bin/env node

import { TextTransformerTest, demonstrateTransformer } from './transformation/text-transformer-test.js';

async function main() {
  console.log('🚀 Running Text Transformer Tests...\n');
  
  // Run the main test suite
  const testSuite = new TextTransformerTest();
  const results = await testSuite.runAllTests();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Run specific feature tests
  await testSuite.testSpecificFeatures();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Run performance test
  await testSuite.testPerformance();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Run demonstration
  await demonstrateTransformer();
  
  // Exit with proper code
  process.exit(results.successRate === 100 ? 0 : 1);
}

main().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});