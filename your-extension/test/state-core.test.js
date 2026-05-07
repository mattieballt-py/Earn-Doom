const test = require('node:test');
const assert = require('node:assert/strict');
const stateCore = require('../src/shared/state-core.js');

function createMemoryStorage(initialState = {}) {
  const data = { ...initialState };

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

test('generateQuota stays within the configured range', () => {
  for (let index = 0; index < 100; index += 1) {
    const quota = stateCore.generateQuota(() => index / 100);
    assert.ok(quota >= stateCore.QUOTA_MIN);
    assert.ok(quota <= stateCore.QUOTA_MAX);
  }
});

test('createInitialState creates durable defaults', () => {
  const state = stateCore.createInitialState({ randomFn: () => 0.25, nowFn: () => 123456 });

  assert.equal(state.currentCount, 0);
  assert.equal(state.blocked, false);
  assert.equal(state.quota, 7);
  assert.match(state.sessionId, /^2n9c-/);
  assert.deepEqual(state.overlayPosition, { x: 24, y: 24 });
  assert.deepEqual(state.history, []);
});

test('state store loads, saves, ensures, and resets using browser storage semantics', async () => {
  const storage = createMemoryStorage();
  const store = stateCore.createStateStore(storage, { randomFn: () => 0.1, nowFn: () => 999 });

  const ensured = await store.ensure();
  assert.equal(ensured.quota, 6);
  assert.equal(ensured.currentCount, 0);

  const loaded = await store.load();
  assert.deepEqual(loaded, ensured);

  const saved = await store.save({
    currentCount: 4,
    quota: 12,
    blocked: true,
    overlayPosition: { x: 50, y: 90 },
    sessionId: 'custom-session',
    history: [{ completed: true }],
  });

  assert.equal(saved.blocked, true);
  assert.equal(saved.quota, 12);
  assert.deepEqual(storage.snapshot()[stateCore.STORAGE_KEY], saved);

  const reset = await store.reset();
  assert.equal(reset.currentCount, 0);
  assert.equal(reset.blocked, false);
  assert.equal(reset.quota, 6);
});
