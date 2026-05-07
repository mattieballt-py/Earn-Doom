const test = require('node:test');
const assert = require('node:assert/strict');
const diagnostics = require('../src/content/detection-diagnostics.js');

function createMemoryStorage() {
  const data = {};
  return {
    async get(key) {
      return { [key]: data[key] };
    },
    async set(nextValues) {
      Object.assign(data, nextValues);
    },
    snapshot() {
      return { ...data };
    },
  };
}

test('records and persists detection failures locally', async () => {
  const storage = createMemoryStorage();
  const tracker = diagnostics.createDetectionDiagnostics({
    storageArea: storage,
    key: 'diagnostics',
    maxEvents: 2,
  });

  await tracker.record('missing_content_signature', { location: 'https://www.instagram.com/' });
  await tracker.record('missing_content_signature', { location: 'https://www.instagram.com/reel/abc/' });
  await tracker.record('manual_recovery', { location: 'https://www.instagram.com/' });

  const saved = storage.snapshot().diagnostics;
  assert.equal(saved.counts.missing_content_signature, 2);
  assert.equal(saved.counts.manual_recovery, 1);
  assert.equal(saved.events.length, 2);
  assert.equal(saved.events[0].type, 'missing_content_signature');
  assert.equal(saved.events[1].type, 'manual_recovery');
});
