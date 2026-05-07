(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.EarnDoomInstagramSignature = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizeInstagramPath(pathname) {
    const path = pathname.replace(/\/+$/, '');
    const contentMatch = path.match(/^\/(p|reel|stories)\/[^/]+(?:\/[^/]+)?(?:\/[^/]+)?/);

    if (!contentMatch) {
      return null;
    }

    if (contentMatch[1] === 'stories') {
      return `story:${contentMatch[0]}`;
    }

    if (contentMatch[1] === 'reel') {
      return `reel:${contentMatch[0]}`;
    }

    return `post:${contentMatch[0]}`;
  }

  function isComposerPath(pathname) {
    return /^\/create(\/|$)/.test(pathname);
  }

  function resolveContentSignature(context) {
    const safeContext = context || {};
    const locationHref = typeof safeContext.locationHref === 'string' ? safeContext.locationHref : '';
    const target = safeContext.target || null;

    let url;
    try {
      url = new URL(locationHref || 'https://www.instagram.com/');
    } catch (error) {
      url = new URL('https://www.instagram.com/');
    }

    if (isComposerPath(url.pathname)) {
      return null;
    }

    if (target && typeof target.closest === 'function') {
      const link = target.closest('a[href]');
      if (link && typeof link.href === 'string') {
        try {
          const linkedUrl = new URL(link.href, url.href);
          const signature = normalizeInstagramPath(linkedUrl.pathname);
          if (signature) {
            return signature;
          }
        } catch (error) {
          return null;
        }
      }
    }

    return normalizeInstagramPath(url.pathname);
  }

  return {
    normalizeInstagramPath,
    isComposerPath,
    resolveContentSignature,
  };
});
