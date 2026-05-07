(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.EarnDoomDetectionDiagnostics = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_KEY = 'earnDoom.detectionDiagnostics';

  function createDetectionDiagnostics(options) {
    const config = options || {};
    const storageArea = config.storageArea;
    const key = typeof config.key === 'string' ? config.key : DEFAULT_KEY;
    const maxEvents = Number.isFinite(config.maxEvents) ? config.maxEvents : 25;

    async function load() {
      if (!storageArea || typeof storageArea.get !== 'function') {
        return { counts: {}, events: [] };
      }

      const entry = await storageArea.get(key);
      return entry && entry[key] ? entry[key] : { counts: {}, events: [] };
    }

    async function save(nextValue) {
      if (!storageArea || typeof storageArea.set !== 'function') {
        return nextValue;
      }

      await storageArea.set({ [key]: nextValue });
      return nextValue;
    }

    return {
      async record(type, details) {
        const current = await load();
        const counts = { ...(current.counts || {}) };
        counts[type] = (counts[type] || 0) + 1;
        const events = Array.isArray(current.events) ? current.events.slice() : [];
        events.push({ type, details: details || {}, at: Date.now() });

        return save({
          counts,
          events: events.slice(-maxEvents),
        });
      },

      load,

      async clear() {
        return save({ counts: {}, events: [] });
      },
    };
  }

  return {
    DEFAULT_KEY,
    createDetectionDiagnostics,
  };
});
