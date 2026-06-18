#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Simple test to verify the words.html page is properly created
 */
function testWordsPageCreation() {
  console.log('🔍 Testing Words Page Creation...\n');
  
  const wordsPath = path.join(process.cwd(), 'words.html');
  
  // Test 1: File exists
  if (!fs.existsSync(wordsPath)) {
    console.error('❌ FAIL: words.html file does not exist');
    return false;
  }
  console.log('✅ PASS: words.html file exists');
  
  // Test 2: File is not empty
  const stats = fs.statSync(wordsPath);
  if (stats.size === 0) {
    console.error('❌ FAIL: words.html file is empty');
    return false;
  }
  console.log(`✅ PASS: words.html file has content (${stats.size} bytes)`);
  
  // Test 3: Contains expected HTML structure
  const content = fs.readFileSync(wordsPath, 'utf-8');
  
  const expectedElements = [
    '<!DOCTYPE html>',
    '<title>Wikidata Word Viewer</title>',
    'Word Explorer',
    'search-input',
    'search-button',
    'word-card',
    'entity-item',
    'IPA',
    'React',
    'wikidata-api-browser.js'
  ];
  
  let missingElements = [];
  expectedElements.forEach(element => {
    if (!content.includes(element)) {
      missingElements.push(element);
    }
  });
  
  if (missingElements.length > 0) {
    console.error('❌ FAIL: Missing expected elements:', missingElements);
    return false;
  }
  console.log('✅ PASS: All expected HTML elements are present');
  
  // Test 4: CSS variables for theming
  const themeElements = ['--background', '--neon', '--ipa-color', 'data-theme'];
  let missingThemeElements = [];
  themeElements.forEach(element => {
    if (!content.includes(element)) {
      missingThemeElements.push(element);
    }
  });
  
  if (missingThemeElements.length > 0) {
    console.error('❌ FAIL: Missing theme elements:', missingThemeElements);
    return false;
  }
  console.log('✅ PASS: Theme system is properly implemented');
  
  // Test 5: React and JavaScript structure
  const jsElements = [
    'React.useState',
    'searchUtility.searchExactMatch',
    'extractIPA',
    'P898', // IPA property ID
    'handleEntityClick'
  ];
  
  let missingJsElements = [];
  jsElements.forEach(element => {
    if (!content.includes(element)) {
      missingJsElements.push(element);
    }
  });
  
  if (missingJsElements.length > 0) {
    console.error('❌ FAIL: Missing JavaScript elements:', missingJsElements);
    return false;
  }
  console.log('✅ PASS: React components and JavaScript logic are present');
  
  console.log('\n🎉 All tests passed! Words page is properly created.\n');
  return true;
}

function testRequirementCompliance() {
  console.log('📋 Testing Requirements Compliance...\n');
  
  const wordsPath = path.join(process.cwd(), 'words.html');
  const content = fs.readFileSync(wordsPath, 'utf-8');
  
  // Issue #14 requirements:
  // 1. Word should be written in its language
  // 2. Word should be written in IPA (international phonetic alphabet)
  // 3. Give a list of all entities that this word can represent
  
  const requirements = [
    {
      name: 'Display word in its language',
      check: content.includes('word-title') && content.includes('result.label'),
      description: 'Word is displayed prominently with proper styling'
    },
    {
      name: 'IPA pronunciation support', 
      check: content.includes('word-ipa') && content.includes('P898') && content.includes('extractIPA'),
      description: 'IPA extraction from Wikidata property P898'
    },
    {
      name: 'List entities the word represents',
      check: content.includes('entities-section') && content.includes('Entities this word can represent'),
      description: 'Section dedicated to showing all entity representations'
    },
    {
      name: 'Search functionality',
      check: content.includes('handleSearch') && content.includes('searchUtility.searchExactMatch'),
      description: 'Ability to search for words using Wikidata API'
    },
    {
      name: 'Language support',
      check: content.includes('selectedLanguage') && content.includes('language-switcher'),
      description: 'Multi-language support with language switching'
    },
    {
      name: 'Theme consistency',
      check: content.includes('theme-toggle') && content.includes('[data-theme="light"]'),
      description: 'Dark/light theme support consistent with other pages'
    },
    {
      name: 'Navigation integration',
      check: content.includes('entities.html#') && content.includes('handleEntityClick'),
      description: 'Integration with existing entity pages'
    }
  ];
  
  let passedRequirements = 0;
  requirements.forEach(req => {
    if (req.check) {
      console.log(`✅ PASS: ${req.name} - ${req.description}`);
      passedRequirements++;
    } else {
      console.log(`❌ FAIL: ${req.name} - ${req.description}`);
    }
  });
  
  const successRate = (passedRequirements / requirements.length) * 100;
  console.log(`\n📊 Requirements compliance: ${passedRequirements}/${requirements.length} (${successRate.toFixed(1)}%)\n`);
  
  return successRate === 100;
}

async function main() {
  console.log('🧪 Testing Words Page Implementation\n');
  console.log('=' * 50);
  
  const basicTests = testWordsPageCreation();
  const requirementTests = testRequirementCompliance();
  
  if (basicTests && requirementTests) {
    console.log('🎉 All tests passed! Words page implementation is complete and meets requirements.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});