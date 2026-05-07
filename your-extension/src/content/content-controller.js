(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../shared/state-core.js'),
      require('./instagram-signature.js'),
      require('./overlay.js'),
      require('./content-mask.js'),
      require('./composer-state.js'),
      require('./publish-state.js'),
      require('./detection-diagnostics.js')
    );
    return;
  }

  root.EarnDoomContentController = factory(
    root.EarnDoomStateCore,
    root.EarnDoomInstagramSignature,
    root.EarnDoomOverlay,
    root.EarnDoomContentMask,
    root.EarnDoomComposerState,
    root.EarnDoomPublishState,
    root.EarnDoomDetectionDiagnostics
  );
})(typeof globalThis !== 'undefined' ? globalThis : this, function (stateCore, signatureCore, overlayCore, maskCore, composerCore, publishCore, diagnosticsCore) {
  async function createContentController(options) {
    const config = options || {};
    const window = config.window;
    const document = config.document;
    const stateStore = config.stateStore;
    const overlayFactory = typeof config.overlayFactory === 'function'
      ? config.overlayFactory
      : overlayCore.createCounterOverlay;
    const maskFactory = typeof config.maskFactory === 'function'
      ? config.maskFactory
      : (maskCore && typeof maskCore.createContentMask === 'function' && typeof document.querySelectorAll === 'function'
        ? maskCore.createContentMask
        : function () {
          return {
            setBlocked() {},
            show() {},
            hide() {},
            destroy() {},
          };
        });
    const composerStateResolver = typeof config.composerStateResolver === 'function'
      ? config.composerStateResolver
      : composerCore.isComposerActive;
    const publishActionResolver = typeof config.publishActionResolver === 'function'
      ? config.publishActionResolver
      : publishCore.isPublishActionTarget;
    const diagnostics = config.diagnostics || (diagnosticsCore && typeof diagnosticsCore.createDetectionDiagnostics === 'function'
      ? diagnosticsCore.createDetectionDiagnostics({ storageArea: typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null })
      : { record() { return Promise.resolve(); }, load() { return Promise.resolve({ counts: {}, events: [] }); }, clear() { return Promise.resolve(); } });
    const resolveContentSignature = typeof config.resolveContentSignature === 'function'
      ? config.resolveContentSignature
      : signatureCore.resolveContentSignature;

    if (!window || !document || !stateStore) {
      throw new TypeError('createContentController expects window, document, and stateStore');
    }

    const currentState = await stateStore.ensure();
    let lastSignature = resolveContentSignature({
      document,
      locationHref: window.location.href,
    });

    const overlay = overlayFactory({
      document,
      initialState: currentState,
      onManualRecovery: async () => {
        await manualRecoveryReset();
      },
      onPositionChange: async (position) => {
        const latestState = await stateStore.load();
        const nextState = await stateStore.save({
          ...latestState,
          overlayPosition: position,
        });
        overlay.render(nextState);
      },
    });
    const mask = maskFactory({ document });

    if (overlay.root && overlay.root.parentNode !== document.body) {
      document.body.appendChild(overlay.root);
    }

    overlay.render(currentState);
    mask.setBlocked(currentState.blocked && !composerStateResolver({ document, locationHref: window.location.href }));

    function syncMask(state) {
      const composerActive = composerStateResolver({ document, locationHref: window.location.href });
      mask.setBlocked(Boolean(state.blocked) && !composerActive);
    }

    function persistAndRender(nextState) {
      return stateStore.save(nextState).then((savedState) => {
        overlay.render(savedState);
        syncMask(savedState);
        return savedState;
      });
    }

    async function resetCycleAfterPublish() {
      const previousState = await stateStore.load();
      const refreshedState = await stateStore.reset();
      const nextState = await stateStore.save({
        ...refreshedState,
        overlayPosition: previousState.overlayPosition,
        blocked: false,
        currentCount: 0,
      });

      overlay.render(nextState);
      mask.setBlocked(false);
      return nextState;
    }

    async function manualRecoveryReset() {
      const nextState = await resetCycleAfterPublish();
      await diagnostics.record('manual_recovery', { location: window.location.href });
      return nextState;
    }

    function maybeCountContent(target) {
      if (composerStateResolver({ document, locationHref: window.location.href })) {
        mask.setBlocked(false);
        return stateStore.load();
      }

      const signature = resolveContentSignature({
        document,
        locationHref: window.location.href,
        target,
      });

      if (!signature || signature === lastSignature) {
        if (target) {
          diagnostics.record('missing_content_signature', { location: window.location.href });
        }
        return Promise.resolve();
      }

      lastSignature = signature;

      return stateStore.load().then((latestState) => {
        if (latestState.blocked) {
          return latestState;
        }

        const nextCount = Math.min(latestState.currentCount + 1, latestState.quota);
        const nextBlocked = nextCount >= latestState.quota;
        return persistAndRender({
          ...latestState,
          currentCount: nextCount,
          blocked: nextBlocked,
        });
      });
    }

    function maybeHandlePublish(target) {
      if (!composerStateResolver({ document, locationHref: window.location.href })) {
        return Promise.resolve();
      }

      if (!publishActionResolver(target)) {
        diagnostics.record('missing_publish_action', { location: window.location.href });
        return Promise.resolve();
      }

      return resetCycleAfterPublish();
    }

    function handleClick(event) {
      if (composerStateResolver({ document, locationHref: window.location.href })) {
        return maybeHandlePublish(event.target);
      }

      return maybeCountContent(event.target);
    }

    function handleRouteChange() {
      return maybeCountContent(null);
    }

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);

    return {
      overlay,
      recordContentAdvance(target) {
        return maybeCountContent(target);
      },
      recordPublishCompletion(target) {
        return maybeHandlePublish(target);
      },
      manualRecoveryReset() {
        return manualRecoveryReset();
      },
      destroy() {
        if (typeof document.removeEventListener === 'function') {
          document.removeEventListener('click', handleClick, true);
        }
        if (typeof window.removeEventListener === 'function') {
          window.removeEventListener('popstate', handleRouteChange);
          window.removeEventListener('hashchange', handleRouteChange);
        }
        mask.destroy();
        overlay.destroy();
      },
    };
  }

  return {
    createContentController,
  };
});
