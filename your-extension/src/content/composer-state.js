(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.EarnDoomComposerState = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function isComposerActive(context) {
    const safeContext = context || {};
    const document = safeContext.document;
    const locationHref = typeof safeContext.locationHref === 'string' ? safeContext.locationHref : '';

    let url;
    try {
      url = new URL(locationHref || 'https://www.instagram.com/');
    } catch (error) {
      url = new URL('https://www.instagram.com/');
    }

    if (/^\/create(\/|$)/.test(url.pathname)) {
      return true;
    }

    if (!document || typeof document.querySelector !== 'function') {
      return false;
    }

    const composerSelectors = [
      '[role="dialog"] textarea',
      '[role="dialog"] [contenteditable="true"]',
      '[role="dialog"] [aria-label*="Caption"]',
      '[role="dialog"] [data-testid*="create"]',
    ];

    return composerSelectors.some((selector) => Boolean(document.querySelector(selector)));
  }

  return {
    isComposerActive,
  };
});
