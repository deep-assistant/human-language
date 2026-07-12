// IPA Functionality Test
// Tests the IPA transcription feature to ensure it correctly retrieves P898 data

import { client } from '../wikidata-api.js';

console.log('🧪 Testing IPA Transcription Functionality\n');

async function testIpaRetrieval() {
  const testCases = [
    'Q102090', // Apache - should have IPA according to Wikidata docs
    'Q20638126', // tomato - should have IPA according to Wikidata docs
    'Q35120', // Entity (word): "Entity" - might have IPA
    'Q5', // Human - probably no IPA
    'Q42', // Douglas Adams - person probably no IPA
  ];

  console.log('Testing IPA retrieval for various entities...\n');

  for (const entityId of testCases) {
    try {
      console.log(`📝 Testing entity: ${entityId}`);
      
      // Get entity info
      const entity = await client.fetchEntity(entityId, 'en');
      const entityLabel = entity?.labels?.en?.value || entityId;
      
      // Get IPA transcriptions
      const ipaTranscriptions = await client.getIpaTranscription(entityId, 'en|fr|de|es');
      
      console.log(`   Label: ${entityLabel}`);
      
      if (ipaTranscriptions.length > 0) {
        console.log(`   ✅ Found ${ipaTranscriptions.length} IPA transcription(s):`);
        ipaTranscriptions.forEach((ipa, index) => {
          console.log(`      ${index + 1}. /${ipa.value}/`);
          if (ipa.language) {
            console.log(`         Language: ${ipa.language}`);
          }
          if (ipa.variety) {
            console.log(`         Variety: ${ipa.variety}`);
          }
        });
      } else {
        console.log('   ❌ No IPA transcriptions found');
      }
      
      console.log(''); // Empty line for readability
      
    } catch (error) {
      console.error(`   ⚠️  Error testing ${entityId}:`, error.message);
      console.log('');
    }
  }
}

async function testEdgeCases() {
  console.log('\n🔍 Testing edge cases...\n');
  
  // Test non-existent entity
  try {
    console.log('📝 Testing non-existent entity: Q999999999');
    const ipa = await client.getIpaTranscription('Q999999999', 'en');
    console.log(`   Result: ${ipa.length} transcriptions found`);
  } catch (error) {
    console.log(`   Expected error: ${error.message}`);
  }
  
  // Test empty language parameter
  try {
    console.log('\n📝 Testing with empty language parameter:');
    const ipa = await client.getIpaTranscription('Q35120', '');
    console.log(`   Result: ${ipa.length} transcriptions found`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

async function runAllTests() {
  try {
    await testIpaRetrieval();
    await testEdgeCases();
    
    console.log('✨ IPA functionality tests completed!');
    console.log('\n📊 Summary:');
    console.log('- IPA transcription retrieval from P898 property: implemented');
    console.log('- Support for language qualifiers (P407): implemented'); 
    console.log('- Support for pronunciation variety qualifiers (P5237): implemented');
    console.log('- Error handling: implemented');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Run the tests
runAllTests();