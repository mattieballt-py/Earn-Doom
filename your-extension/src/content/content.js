(function () {
  if (!window.EarnDoomStateCore || !window.EarnDoomInstagramSignature || !window.EarnDoomOverlay || !window.EarnDoomContentMask || !window.EarnDoomComposerState || !window.EarnDoomPublishState || !window.EarnDoomDetectionDiagnostics || !window.EarnDoomContentController) {
    return;
  }

  const stateStore = window.EarnDoomStateCore.createStateStore(chrome.storage.local);
  window.EarnDoomContentController.createContentController({
    window,
    document,
    stateStore,
  });
})();
