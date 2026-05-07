(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.EarnDoomPublishState = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function isPublishActionTarget(target) {
    if (!target) {
      return false;
    }

    if (typeof target.closest === 'function') {
      const selectors = [
        'button[type="submit"]',
        '[aria-label*="Share"]',
        '[aria-label*="Post"]',
        '[data-testid*="share"]',
        '[data-testid*="post"]',
      ];

      if (selectors.some((selector) => Boolean(target.closest(selector)))) {
        return true;
      }
    }

    const textContent = typeof target.textContent === 'string' ? target.textContent.toLowerCase() : '';
    return /\b(post|share|publish)\b/.test(textContent);
  }

  return {
    isPublishActionTarget,
  };
});
