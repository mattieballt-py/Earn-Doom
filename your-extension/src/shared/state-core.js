(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.EarnDoomStateCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORAGE_KEY = 'earnDoom.state';
  const QUOTA_MIN = 5;
  const QUOTA_MAX = 15;
  const DEFAULT_OVERLAY_POSITION = { x: 24, y: 24 };

  function randomIntInclusive(min, max, randomFn) {
    const generator = typeof randomFn === 'function' ? randomFn : Math.random;
    return Math.floor(generator() * (max - min + 1)) + min;
  }

  function generateQuota(randomFn) {
    return randomIntInclusive(QUOTA_MIN, QUOTA_MAX, randomFn);
  }

  function createSessionId(nowFn, randomFn) {
    const timeGenerator = typeof nowFn === 'function' ? nowFn : Date.now;
    const randomGenerator = typeof randomFn === 'function' ? randomFn : Math.random;
    const timePart = timeGenerator().toString(36);
    const randomPart = Math.floor(randomGenerator() * 1e9).toString(36);
    return `${timePart}-${randomPart}`;
  }

  function normalizeOverlayPosition(value) {
    if (!value || typeof value !== 'object') {
      return { x: DEFAULT_OVERLAY_POSITION.x, y: DEFAULT_OVERLAY_POSITION.y };
    }

    const x = Number.isFinite(value.x) ? Number(value.x) : DEFAULT_OVERLAY_POSITION.x;
    const y = Number.isFinite(value.y) ? Number(value.y) : DEFAULT_OVERLAY_POSITION.y;
    return { x, y };
  }

  function normalizeState(value, options) {
    const config = options || {};
    const randomFn = config.randomFn;
    const nowFn = config.nowFn;
    const quotaMin = Number.isFinite(config.quotaMin) ? config.quotaMin : QUOTA_MIN;
    const quotaMax = Number.isFinite(config.quotaMax) ? config.quotaMax : QUOTA_MAX;

    const currentCount = Number.isFinite(value && value.currentCount) && value.currentCount >= 0
      ? Math.floor(value.currentCount)
      : 0;

    let quota = Number.isFinite(value && value.quota) ? Math.floor(value.quota) : generateQuota(randomFn);
    if (quota < quotaMin || quota > quotaMax) {
      quota = generateQuota(randomFn);
    }

    const blocked = Boolean(value && value.blocked);
    const sessionId = typeof (value && value.sessionId) === 'string' && value.sessionId.trim()
      ? value.sessionId
      : createSessionId(nowFn, randomFn);
    const overlayPosition = normalizeOverlayPosition(value && value.overlayPosition);
    const history = Array.isArray(value && value.history) ? value.history.slice() : [];

    return {
      currentCount,
      quota,
      blocked,
      overlayPosition,
      sessionId,
      history,
    };
  }

  function createInitialState(options) {
    return normalizeState({}, options);
  }

  function createStateStore(storageArea, options) {
    if (!storageArea || typeof storageArea.get !== 'function' || typeof storageArea.set !== 'function') {
      throw new TypeError('createStateStore expects a storage area with get and set methods');
    }

    const config = options || {};

    return {
      async load() {
        const entry = await storageArea.get(STORAGE_KEY);
        return normalizeState(entry && entry[STORAGE_KEY], config);
      },

      async save(state) {
        const nextState = normalizeState(state, config);
        await storageArea.set({ [STORAGE_KEY]: nextState });
        return nextState;
      },

      async ensure() {
        const entry = await storageArea.get(STORAGE_KEY);
        if (entry && entry[STORAGE_KEY]) {
          return normalizeState(entry[STORAGE_KEY], config);
        }

        const initialState = createInitialState(config);
        await storageArea.set({ [STORAGE_KEY]: initialState });
        return initialState;
      },

      async reset() {
        const freshState = createInitialState(config);
        await storageArea.set({ [STORAGE_KEY]: freshState });
        return freshState;
      },
    };
  }

  return {
    STORAGE_KEY,
    QUOTA_MIN,
    QUOTA_MAX,
    DEFAULT_OVERLAY_POSITION,
    generateQuota,
    createSessionId,
    normalizeOverlayPosition,
    normalizeState,
    createInitialState,
    createStateStore,
  };
});
