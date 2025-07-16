// Local storage utilities for Wikidata Viewer
const STORAGE_KEYS = {
  THEME: 'wikidata_viewer_theme',
  LANGUAGE: 'wikidata_viewer_language'
};

function saveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

function loadFromLocalStorage(key, defaultValue) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
}

// Flag map for language switcher
const flagMap = {
  'en': '🇬🇧',
  'es': '🇪🇸',
  'fr': '🇫🇷',
  'de': '🇩🇪',
  'it': '🇮🇹',
  'ru': '🇷🇺',
  'zh': '🇨🇳',
  'ja': '🇯🇵',
  'ko': '🇰🇷',
  'ar': '🇸🇦',
  'hi': '🇮🇳',
  'pt': '🇵🇹',
  'bn': '🇧🇩',
  'ta': '🇮🇳',
  'te': '🇮🇳',
  'ml': '🇮🇳',
  'ur': '🇵🇰',
  'fa': '🇮🇷',
  'tr': '🇹🇷',
  'vi': '🇻🇳'
}; 