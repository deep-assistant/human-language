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

// Helper function to get flag for any language code
function getFlagForLanguage(langCode) {
  // First try exact match
  if (flagMap[langCode]) {
    return flagMap[langCode];
  }
  
  // Try base language (e.g., 'en' from 'en-US')
  const baseLang = langCode.split('-')[0];
  if (flagMap[baseLang]) {
    return flagMap[baseLang];
  }
  
  // Try to map common language codes to their base forms
  const langMappings = {
    'zh-hans': 'zh', 'zh-hant': 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', 'zh-hk': 'zh', 'zh-sg': 'zh', 'zh-mo': 'zh',
    'pt-br': 'pt', 'pt-pt': 'pt', 'es-ar': 'es', 'es-mx': 'es', 'es-co': 'es', 'es-pe': 'es', 'es-ve': 'es',
    'es-cl': 'es', 'es-ec': 'es', 'es-gt': 'es', 'es-cu': 'es', 'es-bo': 'es', 'es-do': 'es', 'es-hn': 'es',
    'es-py': 'es', 'es-sv': 'es', 'es-ni': 'es', 'es-cr': 'es', 'es-pa': 'es', 'es-gq': 'es', 'es-pr': 'es',
    'en-us': 'en', 'en-gb': 'en', 'en-au': 'en', 'en-ca': 'en', 'en-nz': 'en', 'en-ie': 'en', 'en-za': 'en',
    'fr-ca': 'fr', 'fr-be': 'fr', 'fr-ch': 'fr', 'fr-lu': 'fr', 'fr-mc': 'fr',
    'de-at': 'de', 'de-ch': 'de', 'de-lu': 'de', 'de-li': 'de',
    'it-ch': 'it', 'it-sm': 'it', 'it-va': 'it',
    'nl-be': 'nl', 'nl-aw': 'nl', 'nl-cw': 'nl', 'nl-sx': 'nl',
    'sv-fi': 'sv', 'sv-ax': 'sv',
    'no-bm': 'no', 'no-sj': 'no',
    'da-gl': 'da', 'da-fo': 'da',
    'fi-ax': 'fi',
    'ru-by': 'ru', 'ru-kz': 'ru', 'ru-kg': 'ru', 'ru-tj': 'ru', 'ru-tm': 'ru', 'ru-uz': 'ru', 'ru-md': 'ru',
    'uk-by': 'uk', 'uk-kz': 'uk', 'uk-kg': 'uk', 'uk-tj': 'uk', 'uk-tm': 'uk', 'uk-uz': 'uk', 'uk-md': 'uk',
    'be-by': 'be', 'be-kz': 'be', 'be-kg': 'be', 'be-tj': 'be', 'be-tm': 'be', 'be-uz': 'be', 'be-md': 'be',
    'kk-kz': 'kk', 'kk-kg': 'kk', 'kk-tj': 'kk', 'kk-tm': 'kk', 'kk-uz': 'kk', 'kk-md': 'kk',
    'ky-kg': 'ky', 'ky-kz': 'ky', 'ky-tj': 'ky', 'ky-tm': 'ky', 'ky-uz': 'ky', 'ky-md': 'ky',
    'uz-uz': 'uz', 'uz-kz': 'uz', 'uz-kg': 'uz', 'uz-tj': 'uz', 'uz-tm': 'uz', 'uz-md': 'uz',
    'tk-tm': 'tk', 'tk-kz': 'tk', 'tk-kg': 'tk', 'tk-tj': 'tk', 'tk-uz': 'tk', 'tk-md': 'tk',
    'tg-tj': 'tg', 'tg-kz': 'tg', 'tg-kg': 'tg', 'tg-tm': 'tg', 'tg-uz': 'tg', 'tg-md': 'tg',
    'mn-mn': 'mn', 'mn-kz': 'mn', 'mn-kg': 'mn', 'mn-tj': 'mn', 'mn-tm': 'mn', 'mn-uz': 'mn', 'mn-md': 'mn',
    'ka-ge': 'ka', 'ka-az': 'ka', 'ka-tr': 'ka', 'ka-am': 'ka', 'ka-ru': 'ka',
    'hy-am': 'hy', 'hy-ge': 'hy', 'hy-az': 'hy', 'hy-tr': 'hy', 'hy-ru': 'hy',
    'az-az': 'az', 'az-ge': 'az', 'az-tr': 'az', 'az-am': 'az', 'az-ru': 'az',
    'tr-tr': 'tr', 'tr-ge': 'tr', 'tr-az': 'tr', 'tr-am': 'tr', 'tr-ru': 'tr',
    'ku-latn': 'ku', 'ku-arab': 'ku', 'ku-cyrl': 'ku',
    'ar-sa': 'ar', 'ar-eg': 'ar', 'ar-ma': 'ar', 'ar-dz': 'ar', 'ar-tn': 'ar', 'ar-ly': 'ar', 'ar-sd': 'ar',
    'ar-td': 'ar', 'ar-mr': 'ar', 'ar-jo': 'ar', 'ar-lb': 'ar', 'ar-sy': 'ar', 'ar-iq': 'ar', 'ar-kw': 'ar',
    'ar-ae': 'ar', 'ar-bh': 'ar', 'ar-qa': 'ar', 'ar-om': 'ar', 'ar-ye': 'ar', 'ar-so': 'ar', 'ar-dj': 'ar',
    'ar-er': 'ar', 'ar-et': 'ar', 'ar-il': 'ar', 'ar-palestine': 'ar', 'ar-il': 'ar', 'ar-palestine': 'ar',
    'fa-ir': 'fa', 'fa-af': 'fa', 'fa-tj': 'fa', 'fa-uz': 'fa', 'fa-pk': 'fa',
    'ps-af': 'ps', 'ps-pk': 'ps',
    'ur-pk': 'ur', 'ur-in': 'ur',
    'he-il': 'he', 'he-palestine': 'he',
    'yi-il': 'yi', 'yi-us': 'yi', 'yi-ca': 'yi', 'yi-gb': 'yi', 'yi-au': 'yi', 'yi-za': 'yi',
    'am-et': 'am', 'am-il': 'am', 'am-se': 'am', 'am-us': 'am', 'am-ca': 'am', 'am-gb': 'am', 'am-au': 'am',
    'sw-tz': 'sw', 'sw-ke': 'sw', 'sw-ug': 'sw', 'sw-rw': 'sw', 'sw-bi': 'sw', 'sw-cd': 'sw', 'sw-mz': 'sw',
    'zu-za': 'zu', 'zu-zw': 'zu', 'zu-bw': 'zu', 'zu-ls': 'zu', 'zu-sz': 'zu', 'zu-na': 'zu',
    'xh-za': 'xh', 'xh-zw': 'xh', 'xh-bw': 'xh', 'xh-ls': 'xh', 'xh-sz': 'xh', 'xh-na': 'xh',
    'af-za': 'af', 'af-na': 'af', 'af-bw': 'af', 'af-ls': 'af', 'af-sz': 'af', 'af-zw': 'af',
    'st-za': 'st', 'st-ls': 'st', 'st-sz': 'st', 'st-zw': 'st', 'st-bw': 'st', 'st-na': 'st',
    'ss-za': 'ss', 'ss-zw': 'ss', 'ss-bw': 'ss', 'ss-ls': 'ss', 'ss-sz': 'ss', 'ss-na': 'ss',
    've-za': 've', 've-zw': 've', 've-bw': 've', 've-ls': 've', 've-sz': 've', 've-na': 've',
    'ts-za': 'ts', 'ts-zw': 'ts', 'ts-bw': 'ts', 'ts-ls': 'ts', 'ts-sz': 'ts', 'ts-na': 'ts',
    'tn-bw': 'tn', 'tn-za': 'tn', 'tn-zw': 'tn', 'tn-ls': 'tn', 'tn-sz': 'tn', 'tn-na': 'tn',
    'ha-ng': 'ha', 'ha-ne': 'ha', 'ha-gh': 'ha', 'ha-cm': 'ha', 'ha-td': 'ha', 'ha-sd': 'ha', 'ha-er': 'ha',
    'yo-ng': 'yo', 'yo-bj': 'yo', 'yo-tg': 'yo', 'yo-gh': 'yo', 'yo-td': 'yo', 'yo-cm': 'yo',
    'ig-ng': 'ig', 'ig-cm': 'ig', 'ig-eq': 'ig', 'ig-gq': 'ig',
    'ff-sn': 'ff', 'ff-mr': 'ff', 'ff-gm': 'ff', 'ff-gw': 'ff', 'ff-gn': 'ff', 'ff-bf': 'ff', 'ff-ne': 'ff',
    'ff-ng': 'ff', 'ff-cm': 'ff', 'ff-td': 'ff', 'ff-cf': 'ff', 'ff-cm': 'ff', 'ff-td': 'ff', 'ff-cf': 'ff',
    'wo-sn': 'wo', 'wo-mr': 'wo', 'wo-gm': 'wo', 'wo-gw': 'wo', 'wo-gn': 'wo', 'wo-bf': 'wo', 'wo-ne': 'wo',
    'sn-zw': 'sn', 'sn-bw': 'sn', 'sn-ls': 'sn', 'sn-sz': 'sn', 'sn-na': 'sn', 'sn-za': 'sn',
    'ny-mw': 'ny', 'ny-zw': 'ny', 'ny-za': 'ny', 'ny-mz': 'ny', 'ny-tz': 'ny', 'ny-ug': 'ny',
    'so-so': 'so', 'so-et': 'so', 'so-ke': 'so', 'so-dj': 'so', 'so-er': 'so', 'so-ye': 'so',
    'om-et': 'om', 'om-ke': 'om', 'om-sd': 'om', 'om-er': 'om', 'om-so': 'om', 'om-dj': 'om',
    'ti-er': 'ti', 'ti-et': 'ti',
    'mg-mg': 'mg',
    'rw-rw': 'rw', 'rw-ug': 'rw', 'rw-cd': 'rw', 'rw-tz': 'rw', 'rw-bi': 'rw',
    'ak-gh': 'ak', 'ak-ci': 'ak', 'ak-bf': 'ak', 'ak-tg': 'ak', 'ak-ne': 'ak', 'ak-ml': 'ak',
    'tw-gh': 'tw', 'tw-ci': 'tw', 'tw-bf': 'tw', 'tw-tg': 'tw', 'tw-ne': 'tw', 'tw-ml': 'tw',
    'ee-gh': 'ee', 'ee-tg': 'ee', 'ee-bf': 'ee', 'ee-ne': 'ee', 'ee-ml': 'ee', 'ee-ci': 'ee',
    'iu-ca': 'iu', 'iu-us': 'iu', 'iu-gl': 'iu',
    'oj-ca': 'oj', 'oj-us': 'oj',
    'cr-ca': 'cr', 'cr-us': 'cr',
    'moh-ca': 'moh', 'moh-us': 'moh',
    'atj-ca': 'atj',
    'den-ca': 'den', 'den-us': 'den',
    'dgr-ca': 'dgr', 'dgr-us': 'dgr',
    'ikt-ca': 'ikt', 'ikt-us': 'ikt',
    'ike-ca': 'ike', 'ike-us': 'ike',
    'ikt-latn': 'ikt', 'ikt-cans': 'ikt', 'ikt-deva': 'ikt',
    'haw-us': 'haw',
    'mi-nz': 'mi',
    'fj-fj': 'fj',
    'sm-ws': 'sm', 'sm-as': 'sm', 'sm-nz': 'sm', 'sm-au': 'sm', 'sm-us': 'sm',
    'to-to': 'to', 'to-nz': 'to', 'to-au': 'to', 'to-us': 'to',
    'ty-pf': 'ty', 'ty-au': 'ty', 'ty-nz': 'ty', 'ty-us': 'ty',
    'co-fr': 'co',
    'qu-pe': 'qu', 'qu-bo': 'qu', 'qu-ec': 'qu', 'qu-ar': 'qu', 'qu-cl': 'qu',
    'ay-bo': 'ay', 'ay-pe': 'ay', 'ay-ec': 'ay', 'ay-ar': 'ay', 'ay-cl': 'ay',
    'gn-py': 'gn', 'gn-ar': 'gn', 'gn-bo': 'gn', 'gn-pe': 'gn', 'gn-ec': 'gn', 'gn-cl': 'gn',
    'ht-ht': 'ht', 'ht-us': 'ht', 'ht-ca': 'ht', 'ht-fr': 'ht', 'ht-do': 'ht', 'ht-cu': 'ht',
    'crh-ua': 'crh', 'crh-ru': 'crh', 'crh-tr': 'crh', 'crh-ro': 'crh', 'crh-bg': 'crh', 'crh-gr': 'crh',
    'sa-in': 'sa', 'sa-np': 'sa', 'sa-bd': 'sa', 'sa-pk': 'sa', 'sa-lk': 'sa', 'sa-mv': 'sa',
    'skr-pk': 'skr', 'skr-in': 'skr', 'skr-af': 'skr',
    'mr-in': 'mr', 'mr-pk': 'mr', 'mr-bd': 'mr', 'mr-np': 'mr', 'mr-lk': 'mr', 'mr-mv': 'mr',
    'bho-in': 'bho', 'bho-np': 'bho', 'bho-pk': 'bho', 'bho-bd': 'bho', 'bho-lk': 'bho', 'bho-mv': 'bho',
    'awa-in': 'awa', 'awa-np': 'awa', 'awa-pk': 'awa', 'awa-bd': 'awa', 'awa-lk': 'awa', 'awa-mv': 'awa',
    'mai-in': 'mai', 'mai-np': 'mai', 'mai-pk': 'mai', 'mai-bd': 'mai', 'mai-lk': 'mai', 'mai-mv': 'mai',
    'raj-in': 'raj', 'raj-pk': 'raj', 'raj-bd': 'raj', 'raj-np': 'raj', 'raj-lk': 'raj', 'raj-mv': 'raj',
    'doi-in': 'doi', 'doi-pk': 'doi', 'doi-bd': 'doi', 'doi-np': 'doi', 'doi-lk': 'doi', 'doi-mv': 'doi',
    'sat-in': 'sat', 'sat-bd': 'sat', 'sat-np': 'sat', 'sat-pk': 'sat', 'sat-lk': 'sat', 'sat-mv': 'sat',
    'mni-in': 'mni', 'mni-bd': 'mni', 'mni-np': 'mni', 'mni-pk': 'mni', 'mni-lk': 'mni', 'mni-mv': 'mni',
    'bpy-in': 'bpy', 'bpy-bd': 'bpy', 'bpy-np': 'bpy', 'bpy-pk': 'bpy', 'bpy-lk': 'bpy', 'bpy-mv': 'bpy',
    'ksw-mm': 'ksw', 'ksw-th': 'ksw', 'ksw-bd': 'ksw', 'ksw-in': 'ksw', 'ksw-np': 'ksw', 'ksw-pk': 'ksw',
    'mnw-mm': 'mnw', 'mnw-th': 'mnw', 'mnw-bd': 'mnw', 'mnw-in': 'mnw', 'mnw-np': 'mnw', 'mnw-pk': 'mnw',
    'shn-mm': 'shn', 'shn-th': 'shn', 'shn-bd': 'shn', 'shn-in': 'shn', 'shn-np': 'shn', 'shn-pk': 'shn',
    'kac-mm': 'kac', 'kac-th': 'kac', 'kac-bd': 'kac', 'kac-in': 'kac', 'kac-np': 'kac', 'kac-pk': 'kac',
    'pwo-mm': 'pwo', 'pwo-th': 'pwo', 'pwo-bd': 'pwo', 'pwo-in': 'pwo', 'pwo-np': 'pwo', 'pwo-pk': 'pwo',
    'blk-mm': 'blk', 'blk-th': 'blk', 'blk-bd': 'blk', 'blk-in': 'blk', 'blk-np': 'blk', 'blk-pk': 'blk',
    'aak-mm': 'aak', 'aak-th': 'aak', 'aak-bd': 'aak', 'aak-in': 'aak', 'aak-np': 'aak', 'aak-pk': 'aak',
    'tct-mm': 'tct', 'tct-th': 'tct', 'tct-bd': 'tct', 'tct-in': 'tct', 'tct-np': 'tct', 'tct-pk': 'tct',
    'wea-mm': 'wea', 'wea-th': 'wea', 'wea-bd': 'wea', 'wea-in': 'wea', 'wea-np': 'wea', 'wea-pk': 'wea',
    'pck-mm': 'pck', 'pck-th': 'pck', 'pck-bd': 'pck', 'pck-in': 'pck', 'pck-np': 'pck', 'pck-pk': 'pck',
    'tcp-mm': 'tcp', 'tcp-th': 'tcp', 'tcp-bd': 'tcp', 'tcp-in': 'tcp', 'tcp-np': 'tcp', 'tcp-pk': 'tcp',
    'cnh-mm': 'cnh', 'cnh-th': 'cnh', 'cnh-bd': 'cnh', 'cnh-in': 'cnh', 'cnh-np': 'cnh', 'cnh-pk': 'cnh',
    'cfm-mm': 'cfm', 'cfm-th': 'cfm', 'cfm-bd': 'cfm', 'cfm-in': 'cfm', 'cfm-np': 'cfm', 'cfm-pk': 'cfm',
    'hlt-mm': 'hlt', 'hlt-th': 'hlt', 'hlt-bd': 'hlt', 'hlt-in': 'hlt', 'hlt-np': 'hlt', 'hlt-pk': 'hlt',
    'cka-mm': 'cka', 'cka-th': 'cka', 'cka-bd': 'cka', 'cka-in': 'cka', 'cka-np': 'cka', 'cka-pk': 'cka',
    'cnk-mm': 'cnk', 'cnk-th': 'cnk', 'cnk-bd': 'cnk', 'cnk-in': 'cnk', 'cnk-np': 'cnk', 'cnk-pk': 'cnk',
    'nqq-mm': 'nqq', 'nqq-th': 'nqq', 'nqq-bd': 'nqq', 'nqq-in': 'nqq', 'nqq-np': 'nqq', 'nqq-pk': 'nqq',
    'tcz-mm': 'tcz', 'tcz-th': 'tcz', 'tcz-bd': 'tcz', 'tcz-in': 'tcz', 'tcz-np': 'tcz', 'tcz-pk': 'tcz',
    'dao-mm': 'dao', 'dao-th': 'dao', 'dao-bd': 'dao', 'dao-in': 'dao', 'dao-np': 'dao', 'dao-pk': 'dao',
    'nst-mm': 'nst', 'nst-th': 'nst', 'nst-bd': 'nst', 'nst-in': 'nst', 'nst-np': 'nst', 'nst-pk': 'nst',
    'kht-mm': 'kht', 'kht-th': 'kht', 'kht-bd': 'kht', 'kht-in': 'kht', 'kht-np': 'kht', 'kht-pk': 'kht',
    'jml-mm': 'jml', 'jml-th': 'jml', 'jml-bd': 'jml', 'jml-in': 'jml', 'jml-np': 'jml', 'jml-pk': 'jml',
    'kvb-mm': 'kvb', 'kvb-th': 'kvb', 'kvb-bd': 'kvb', 'kvb-in': 'kvb', 'kvb-np': 'kvb', 'kvb-pk': 'kvb',
    'aap-mm': 'aap', 'aap-th': 'aap', 'aap-bd': 'aap', 'aap-in': 'aap', 'aap-np': 'aap', 'aap-pk': 'aap'
  };
  
  if (langMappings[langCode]) {
    return flagMap[langMappings[langCode]] || '🌐';
  }
  
  // Fallback to base language
  return flagMap[baseLang] || '🌐';
} 