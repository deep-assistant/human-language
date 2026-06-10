import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { PersistentCacheManager } from '../../src/persistent-cache.js';

test('PersistentCacheManager can persist entries with lino-objects-codec', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'human-language-cache-'));
  try {
    const cache = new PersistentCacheManager(cacheDir, { codec: 'lino' });
    await cache.set('Einstein', { id: 'Q937', labels: ['Albert Einstein'] }, 'en', 1, 'item');

    const key = cache.generateCacheKey('Einstein', 'en', 1, 'item');
    const stored = await readFile(join(cacheDir, `${key}.lino`), 'utf8');
    assert.match(stored, /^\(object/);

    const fresh = new PersistentCacheManager(cacheDir, { codec: 'lino' });
    assert.deepEqual(await fresh.get('Einstein', 'en', 1, 'item'), {
      id: 'Q937',
      labels: ['Albert Einstein'],
    });
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
  }
});
