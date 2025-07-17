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

// Locale-specific quotes for different languages
const localeQuotes = {
  'en': { open: '“', close: '”' },
  'de': { open: '„', close: '“' },
  'fr': { open: '«', close: '»' },
  'ru': { open: '«', close: '»' },
  'pl': { open: '„', close: '”' },
  'es': { open: '«', close: '»' },
  'it': { open: '«', close: '»' },
  'zh': { open: '“', close: '”' },
  'ja': { open: '「', close: '」' },
  'ko': { open: '“', close: '”' },
  'uk': { open: '«', close: '»' },
  'cs': { open: '„', close: '“' },
  'sk': { open: '„', close: '“' },
  'default': { open: '"', close: '"' }
};

function getQuotesForLanguage(langCode) {
  if (localeQuotes[langCode]) return localeQuotes[langCode];
  const baseLang = langCode.split('-')[0];
  if (localeQuotes[baseLang]) return localeQuotes[baseLang];
  return localeQuotes['default'];
}

// Flag map for language switcher - comprehensive Wikidata supported languages
const flagMap = {
  // Major European Languages
  'en': '🇬🇧', 'de': '🇩🇪', 'fr': '🇫🇷', 'es': '🇪🇸', 'it': '🇮🇹', 'pt': '🇵🇹', 'ru': '🇷🇺', 'nl': '🇳🇱',
  'pl': '🇵🇱', 'sv': '🇸🇪', 'da': '🇩🇰', 'no': '🇳🇴', 'fi': '🇫🇮', 'hu': '🇭🇺', 'cs': '🇨🇿', 'sk': '🇸🇰',
  'ro': '🇷🇴', 'bg': '🇧🇬', 'hr': '🇭🇷', 'sl': '🇸🇮', 'et': '🇪🇪', 'lv': '🇱🇻', 'lt': '🇱🇹', 'el': '🇬🇷',
  'ca': '🇪🇸', 'eu': '🇪🇸', 'gl': '🇪🇸', 'ast': '🇪🇸', 'oc': '🇫🇷', 'br': '🇫🇷', 'cy': '🇬🇧', 'ga': '🇮🇪',
  'is': '🇮🇸', 'fo': '🇫🇴', 'mt': '🇲🇹', 'sq': '🇦🇱', 'mk': '🇲🇰', 'sr': '🇷🇸', 'bs': '🇧🇦', 'me': '🇲🇪',
  
  // Asian Languages
  'zh': '🇨🇳', 'ja': '🇯🇵', 'ko': '🇰🇷', 'hi': '🇮🇳', 'bn': '🇧🇩', 'ta': '🇮🇳', 'te': '🇮🇳', 'ml': '🇮🇳',
  'kn': '🇮🇳', 'gu': '🇮🇳', 'pa': '🇮🇳', 'or': '🇮🇳', 'as': '🇮🇳', 'ne': '🇳🇵', 'si': '🇱🇰', 'my': '🇲🇲',
  'th': '🇹🇭', 'vi': '🇻🇳', 'km': '🇰🇭', 'lo': '🇱🇦', 'id': '🇮🇩', 'ms': '🇲🇾', 'tl': '🇵🇭', 'jv': '🇮🇩',
  'su': '🇮🇩', 'min': '🇮🇩', 'ceb': '🇵🇭', 'war': '🇵🇭', 'bjn': '🇮🇩', 'bug': '🇮🇩', 'ban': '🇮🇩',
  
  // Middle Eastern & African Languages
  'ar': '🇸🇦', 'fa': '🇮🇷', 'ur': '🇵🇰', 'ps': '🇦🇫', 'ku': '🇹🇷', 'he': '🇮🇱', 'yi': '🇮🇱', 'am': '🇪🇹',
  'sw': '🇹🇿', 'zu': '🇿🇦', 'xh': '🇿🇦', 'af': '🇿🇦', 'st': '🇿🇦', 'ss': '🇿🇦', 've': '🇿🇦', 'ts': '🇿🇦',
  'tn': '🇧🇼', 'ha': '🇳🇬', 'yo': '🇳🇬', 'ig': '🇳🇬', 'ff': '🇸🇳', 'wo': '🇸🇳', 'sn': '🇿🇼', 'ny': '🇲🇼',
  'so': '🇸🇴', 'om': '🇪🇹', 'ti': '🇪🇷', 'mg': '🇲🇬', 'rw': '🇷🇼', 'ak': '🇬🇭', 'tw': '🇬🇭', 'ee': '🇬🇭',
  
  // North & South American Languages
  'pt-br': '🇧🇷', 'es-ar': '🇦🇷', 'es-mx': '🇲🇽', 'es-co': '🇨🇴', 'es-pe': '🇵🇪', 'es-ve': '🇻🇪',
  'es-cl': '🇨🇱', 'es-ec': '🇪🇨', 'es-gt': '🇬🇹', 'es-cu': '🇨🇺', 'es-bo': '🇧🇴', 'es-do': '🇩🇴',
  'es-hn': '🇭🇳', 'es-py': '🇵🇾', 'es-sv': '🇸🇻', 'es-ni': '🇳🇮', 'es-cr': '🇨🇷', 'es-pa': '🇵🇦',
  'es-gq': '🇬🇶', 'es-pr': '🇵🇷', 'qu': '🇵🇪', 'ay': '🇧🇴', 'gn': '🇵🇾', 'ht': '🇭🇹', 'crh': '🇺🇦',
  
  // Eastern European & Central Asian Languages
  'uk': '🇺🇦', 'be': '🇧🇾', 'kk': '🇰🇿', 'ky': '🇰🇬', 'uz': '🇺🇿', 'tk': '🇹🇲', 'tg': '🇹🇯', 'mn': '🇲🇳',
  'ka': '🇬🇪', 'hy': '🇦🇲', 'az': '🇦🇿', 'tr': '🇹🇷', 'ku-latn': '🇹🇷', 'ku-arab': '🇹🇷',
  
  // South Asian Languages
  'ur': '🇵🇰', 'ps': '🇦🇫', 'sd': '🇵🇰', 'bal': '🇵🇰', 'bra': '🇵🇰', 'ks': '🇮🇳', 'dv': '🇲🇻',
  'dz': '🇧🇹', 'bo': '🇨🇳', 'ug': '🇨🇳', 'zh-hans': '🇨🇳', 'zh-hant': '🇹🇼', 'zh-cn': '🇨🇳',
  'zh-tw': '🇹🇼', 'zh-hk': '🇭🇰', 'zh-sg': '🇸🇬', 'zh-mo': '🇲🇴',
  
  // Pacific & Oceanic Languages
  'haw': '🇺🇸', 'mi': '🇳🇿', 'fj': '🇫🇯', 'sm': '🇼🇸', 'to': '🇹🇴', 'ty': '🇵🇫', 'co': '🇫🇷',
  
  // Indigenous & Minority Languages
  'iu': '🇨🇦', 'oj': '🇨🇦', 'cr': '🇨🇦', 'moh': '🇨🇦', 'atj': '🇨🇦', 'den': '🇨🇦', 'dgr': '🇨🇦',
  'ikt': '🇨🇦', 'ike': '🇨🇦', 'ikt-latn': '🇨🇦', 'ikt-cans': '🇨🇦', 'ikt-deva': '🇨🇦',
  
  // Constructed Languages
  'eo': '🌍', 'ia': '🌍', 'vo': '🌍', 'io': '🌍', 'nov': '🌍', 'lfn': '🌍', 'jbo': '🌍',
  
  // Other Important Languages
  'sa': '🇮🇳', 'skr': '🇵🇰', 'mr': '🇮🇳', 'bho': '🇮🇳', 'awa': '🇮🇳', 'mai': '🇮🇳', 'raj': '🇮🇳',
  'doi': '🇮🇳', 'sat': '🇮🇳', 'mni': '🇮🇳', 'bpy': '🇮🇳', 'ksw': '🇲🇲', 'mnw': '🇲🇲', 'shn': '🇲🇲',
  'kac': '🇲🇲', 'pwo': '🇲🇲', 'blk': '🇲🇲', 'aak': '🇲🇲', 'tct': '🇲🇲', 'wea': '🇲🇲', 'pck': '🇲🇲',
  'tcp': '🇲🇲', 'cnh': '🇲🇲', 'cfm': '🇲🇲', 'hlt': '🇲🇲', 'cka': '🇲🇲', 'cnk': '🇲🇲', 'nqq': '🇲🇲',
  'tcz': '🇲🇲', 'dao': '🇲🇲', 'nst': '🇲🇲', 'kht': '🇲🇲', 'jml': '🇲🇲', 'kvb': '🇲🇲', 'aap': '🇲🇲',
  
  // Fallback for unsupported languages
  'und': '🌐', 'mul': '🌐', 'zxx': '🌐'
};