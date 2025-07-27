#!/usr/bin/env node

import { TextToQPTransformer } from './text-to-qp-transformer.js';

async function demonstrateNgramFeature() {
  console.log('🔍 N-gram Feature Demonstration\n');
  console.log('This demo shows how the transformer handles multi-word phrases\n');
  
  const transformer = new TextToQPTransformer();
  
  const testCases = [
    {
      text: "Barack Obama visited Washington",
      ngramSizes: [1, 2, 3]
    },
    {
      text: "United Nations headquarters",
      ngramSizes: [1, 2, 3]
    },
    {
      text: "theory of relativity",
      ngramSizes: [1, 2, 3]
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Input: "${testCase.text}"`);
    console.log('─'.repeat(50));
    
    for (const size of testCase.ngramSizes) {
      const result = await transformer.transform(testCase.text, { 
        maxNgramSize: size,
        maxCandidates: 1 // Reduce ambiguity for cleaner output
      });
      
      console.log(`\nWith maxNgramSize=${size}:`);
      console.log(`  Output: ${result.formatted}`);
      console.log(`  Sequence length: ${result.sequence.length}`);
      console.log(`  Matched phrases:`);
      
      result.sequence.forEach((item, idx) => {
        if (item.originalText) {
          console.log(`    ${idx + 1}. "${item.originalText}" → ${item.id} (${item.ngramSize} word${item.ngramSize > 1 ? 's' : ''})`);
        } else {
          console.log(`    ${idx + 1}. ${item.id}`);
        }
      });
    }
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('\n✅ Key Observations:');
  console.log('• With maxNgramSize=1: Each word is matched separately');
  console.log('• With maxNgramSize=2: Two-word phrases like "Barack Obama" are matched as units');
  console.log('• With maxNgramSize=3: Three-word phrases like "United Nations headquarters" are matched as units');
  console.log('• Longer matches take priority, preventing redundant matches of component words');
}

demonstrateNgramFeature().catch(console.error);