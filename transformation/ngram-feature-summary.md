# N-gram Feature Implementation Summary

## Overview
The text transformer now supports configurable n-gram matching, allowing it to recognize multi-word phrases as single entities rather than breaking them into individual words.

## Key Features

### 1. Configurable N-gram Size
- New option: `maxNgramSize` (default: 3)
- Controls the maximum number of consecutive words to consider as a single phrase
- Can be set from 1 to any reasonable number (UI limits to 5 for performance)

### 2. Priority-Based Matching
- Longer n-grams are searched first (e.g., triplets before doublets before singlets)
- Once a multi-word phrase is matched, its component words are not searched separately
- Example: "Barack Obama" is matched as one entity, not as "Barack" + "Obama"

### 3. Examples of Behavior

#### With maxNgramSize=1:
- Input: "Barack Obama visited Washington"
- Output: 4 separate matches (Barack, Obama, visited, Washington)

#### With maxNgramSize=2:
- Input: "Barack Obama visited Washington"
- Output: 3 matches ("Barack Obama" as one unit, visited, Washington)

#### With maxNgramSize=3:
- Input: "United Nations headquarters"
- Output: 1 match (the entire phrase as one unit)

## Implementation Details

### Algorithm:
1. Generate all possible n-grams up to maxNgramSize
2. Filter out n-grams containing only stop words
3. Search for all n-grams in parallel
4. Sort results by n-gram size (descending)
5. Apply matches in priority order, marking used tokens
6. Return matches in original order

### Performance:
- Parallel searching of all n-grams
- Efficient token tracking to prevent duplicate matches
- Maintains original text order in output

## Test Results

✅ **Mock Tests**: N-gram specific tests passing
- "Barack Obama as single entity" test: PASSED
- "Theory of Relativity" test: PASSED
- "N-gram with different sizes" test: PASSED

✅ **E2E Tests**: Real API integration working
- "Multi-word entity" test: PASSED
- "Complex phrase" test: PASSED

✅ **Feature Demo**: Demonstrates clear differences in behavior with different maxNgramSize values

## Usage

### In HTML Demo:
- Added "Max n-gram size" input field (1-5)
- Default value: 3
- Results show n-gram size in detailed analysis

### In Code:
```javascript
const result = await transformer.transform("Barack Obama was president", {
  maxNgramSize: 3,  // Consider up to 3-word phrases
  // other options...
});
```

## Benefits
1. More accurate entity recognition for known multi-word phrases
2. Reduces ambiguity by matching longer, more specific phrases
3. Configurable to balance between precision and recall
4. Maintains backward compatibility (default behavior unchanged)