(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.EarnDoomInstagramSignature = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const FEED_ROOT_XPATH = '/html/body/div[1]/div/div/div[2]/div/div/div[1]/div[1]/div[2]/section/main/div/div[2]/div/div/div[1]';
  const CONTENT_SELECTORS = [
    'article',
    '[role="article"]',
    'a[href*="/p/"]',
    'a[href*="/reel/"]',
    'a[href*="/stories/"]',
  ];

  function safeUrl(locationHref) {
    try {
      return new URL(locationHref || 'https://www.instagram.com/');
    } catch {
      return new URL('https://www.instagram.com/');
    }
  }

  function isComposerPath(pathname) {
    return /^\/create(?:\/|$)/.test(pathname);
  }

  function normalizeContentPath(pathname) {
    const path = String(pathname || '').replace(/\/+$/, '');
    const match = path.match(/^\/(p|reel|stories)\/[^/]+(?:\/[^/]+)?(?:\/[^/]+)?/);

    if (!match) {
      return null;
    }

    const type = match[1] === 'p' ? 'post' : match[1] === 'stories' ? 'story' : match[1];
    return `${type}:${match[0]}`;
  }

  function resolveSignatureFromHref(href, baseUrl) {
    if (!href) {
      return null;
    }

    try {
      return normalizeContentPath(new URL(href, baseUrl.href).pathname);
    } catch {
      return null;
    }
  }

  function findFeedRoot(document) {
    if (!document) {
      return null;
    }

    if (typeof document.evaluate === 'function' && typeof XPathResult !== 'undefined') {
      try {
        const result = document.evaluate(
          FEED_ROOT_XPATH,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );

        if (result && result.singleNodeValue) {
          return result.singleNodeValue;
        }
      } catch {
        // Fall through to selector-based lookup.
      }
    }

    if (typeof document.querySelector === 'function') {
      return document.querySelector('main') || document.querySelector('section main') || document.body || document.documentElement || null;
    }

    return document.body || document.documentElement || null;
  }

  function getViewportRect(window, document) {
    const width = Number.isFinite(window && window.innerWidth)
      ? window.innerWidth
      : Number.isFinite(document && document.documentElement && document.documentElement.clientWidth)
        ? document.documentElement.clientWidth
        : 0;

    const height = Number.isFinite(window && window.innerHeight)
      ? window.innerHeight
      : Number.isFinite(document && document.documentElement && document.documentElement.clientHeight)
        ? document.documentElement.clientHeight
        : 0;

    return { left: 0, top: 0, right: width, bottom: height };
  }

  function getVisibleArea(rect, viewport) {
    if (!rect || !viewport) {
      return 0;
    }

    const left = Math.max(rect.left || 0, viewport.left);
    const top = Math.max(rect.top || 0, viewport.top);
    const right = Math.min(rect.right != null ? rect.right : left + (rect.width || 0), viewport.right);
    const bottom = Math.min(rect.bottom != null ? rect.bottom : top + (rect.height || 0), viewport.bottom);

    return Math.max(0, right - left) * Math.max(0, bottom - top);
  }

  function extractHref(node) {
    if (!node) {
      return null;
    }

    if (typeof node.href === 'string' && node.href) {
      return node.href;
    }

    if (typeof node.closest === 'function') {
      const anchor = node.closest('a[href]');
      if (anchor && typeof anchor.href === 'string' && anchor.href) {
        return anchor.href;
      }
    }

    if (typeof node.querySelector === 'function') {
      const anchor = node.querySelector('a[href]');
      if (anchor && typeof anchor.href === 'string' && anchor.href) {
        return anchor.href;
      }
    }

    return null;
  }

  function resolveElementSignature(node, baseUrl) {
    return resolveSignatureFromHref(extractHref(node), baseUrl);
  }

  function collectVisibleCandidates(document) {
    const root = findFeedRoot(document);
    if (!root) {
      return [];
    }

    const candidates = new Set();

    function addFrom(scope) {
      if (!scope || typeof scope.querySelectorAll !== 'function') {
        return;
      }

      for (const selector of CONTENT_SELECTORS) {
        try {
          for (const node of scope.querySelectorAll(selector)) {
            candidates.add(node);
          }
        } catch {
          // Ignore selector failures and keep scanning.
        }
      }
    }

    addFrom(root);

    if (candidates.size === 0 && typeof document.querySelectorAll === 'function') {
      addFrom(document);
    }

    if (candidates.size === 0 && typeof document.querySelector === 'function') {
      for (const selector of CONTENT_SELECTORS) {
        const node = document.querySelector(selector);
        if (node) {
          candidates.add(node);
        }
      }
    }

    return Array.from(candidates);
  }

  function resolveVisibleContentSignature(context) {
    const safeContext = context || {};
    const document = safeContext.document || null;
    const window = safeContext.window || null;
    const url = safeUrl(safeContext.locationHref);

    if (isComposerPath(url.pathname)) {
      return null;
    }

    const viewport = getViewportRect(window, document);
    let bestSignature = null;
    let bestArea = 0;

    for (const candidate of collectVisibleCandidates(document)) {
      if (typeof candidate.getBoundingClientRect !== 'function') {
        continue;
      }

      const signature = resolveElementSignature(candidate, url);
      if (!signature) {
        continue;
      }

      const visibleArea = getVisibleArea(candidate.getBoundingClientRect(), viewport);
      if (visibleArea > bestArea) {
        bestArea = visibleArea;
        bestSignature = signature;
      }
    }

    return bestSignature;
  }

  function resolveContentSignature(context) {
    const safeContext = context || {};
    const url = safeUrl(safeContext.locationHref);

    if (isComposerPath(url.pathname)) {
      return null;
    }

    const visibleSignature = resolveVisibleContentSignature(safeContext);
    if (visibleSignature) {
      return visibleSignature;
    }

    if (safeContext.target) {
      const targetSignature = resolveElementSignature(safeContext.target, url);
      if (targetSignature) {
        return targetSignature;
      }
    }

    return normalizeContentPath(url.pathname);
  }

  return {
    FEED_ROOT_XPATH,
    CONTENT_SELECTORS,
    safeUrl,
    isComposerPath,
    normalizeContentPath,
    resolveSignatureFromHref,
    findFeedRoot,
    getViewportRect,
    getVisibleArea,
    extractHref,
    resolveElementSignature,
    collectVisibleCandidates,
    resolveVisibleContentSignature,
    resolveContentSignature,
  };
});
