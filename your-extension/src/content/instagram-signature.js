(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.EarnDoomInstagramSignature = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SEMANTIC_FEED_ROOT_XPATH = '/html/body/div[1]/div/div/div[2]/div/div/div[1]/div[1]/div[2]/section/main/div/div[2]/div/div/div[1]';
  const CONTENT_TARGET_SELECTOR = 'article, [role="article"], a[href*="/p/"], a[href*="/reel/"], a[href*="/stories/"]';

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

  function safeUrl(locationHref) {
    try {
      return new URL(locationHref || 'https://www.instagram.com/');
    } catch (error) {
      return new URL('https://www.instagram.com/');
    }
  }

  function findInstagramFeedRoot(document) {
    if (!document) {
      return null;
    }

    if (typeof document.evaluate === 'function' && typeof XPathResult !== 'undefined') {
      try {
        const result = document.evaluate(
          SEMANTIC_FEED_ROOT_XPATH,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        if (result && result.singleNodeValue) {
          return result.singleNodeValue;
        }
      } catch (error) {
        // Fall back to selector-based discovery.
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

    const left = Math.max(rect.left, viewport.left);
    const top = Math.max(rect.top, viewport.top);
    const right = Math.min(rect.right != null ? rect.right : rect.left + rect.width, viewport.right);
    const bottom = Math.min(rect.bottom != null ? rect.bottom : rect.top + rect.height, viewport.bottom);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    return width * height;
  }

  function extractLinkFromNode(node) {
    if (!node) {
      return null;
    }

    if (typeof node.href === 'string' && node.href) {
      return node.href;
    }

    if (typeof node.closest === 'function') {
      const link = node.closest('a[href]');
      if (link && typeof link.href === 'string') {
        return link.href;
      }
    }

    if (typeof node.querySelector === 'function') {
      const link = node.querySelector('a[href]');
      if (link && typeof link.href === 'string') {
        return link.href;
      }
    }

    return null;
  }

  function resolveSignatureFromHref(href, baseUrl) {
    if (!href) {
      return null;
    }

    try {
      const linkedUrl = new URL(href, baseUrl.href);
      return normalizeInstagramPath(linkedUrl.pathname);
    } catch (error) {
      return null;
    }
  }

  function resolveElementContentSignature(node, baseUrl) {
    return resolveSignatureFromHref(extractLinkFromNode(node), baseUrl);
  }

  function collectVisibleCandidates(document) {
    const root = findInstagramFeedRoot(document);
    if (!root) {
      return [];
    }

    const selectors = CONTENT_TARGET_SELECTOR;
    const candidateSet = new Set();

    function addCandidates(scope) {
      if (!scope || typeof scope.querySelectorAll !== 'function') {
        return;
      }

      try {
        for (const node of scope.querySelectorAll(selectors)) {
          candidateSet.add(node);
        }
      } catch (error) {
        // Ignore selector failures and keep scanning.
      }
    }

    addCandidates(root);
    if (candidateSet.size === 0 && typeof document.querySelectorAll === 'function') {
      addCandidates(document);
    }

    if (candidateSet.size === 0 && typeof document.querySelector === 'function') {
      for (const selector of CONTENT_TARGET_SELECTOR.split(', ')) {
        const node = document.querySelector(selector);
        if (node) {
          candidateSet.add(node);
        }
      }
    }

    return Array.from(candidateSet);
  }

  function resolveVisibleContentSignature(context) {
    const safeContext = context || {};
    const locationHref = typeof safeContext.locationHref === 'string' ? safeContext.locationHref : '';
    const window = safeContext.window || null;
    const document = safeContext.document || null;

    const url = safeUrl(locationHref);

    if (isComposerPath(url.pathname)) {
      return null;
    }

    const candidates = collectVisibleCandidates(document);
    const viewport = getViewportRect(window, document);
    let bestMatch = null;

    for (const candidate of candidates) {
      const signature = resolveElementContentSignature(candidate, url);
      if (!signature || typeof candidate.getBoundingClientRect !== 'function') {
        continue;
      }

      const rect = candidate.getBoundingClientRect();
      const visibleArea = getVisibleArea(rect, viewport);
      if (visibleArea <= 0) {
        continue;
      }

      if (!bestMatch || visibleArea > bestMatch.visibleArea) {
        bestMatch = { signature, visibleArea };
      }
    }

    return bestMatch ? bestMatch.signature : null;
  }

  function resolveContentSignature(context) {
    const safeContext = context || {};
    const locationHref = typeof safeContext.locationHref === 'string' ? safeContext.locationHref : '';
    const target = safeContext.target || null;

    const url = safeUrl(locationHref);

    if (isComposerPath(url.pathname)) {
      return null;
    }

    const visibleSignature = resolveVisibleContentSignature(safeContext);
    if (visibleSignature) {
      return visibleSignature;
    }

    if (target && typeof target.closest === 'function') {
      const link = target.closest('a[href]');
      if (link && typeof link.href === 'string') {
        const signature = resolveSignatureFromHref(link.href, url);
        if (signature) {
          return signature;
        }
      }
    }

    return normalizeInstagramPath(url.pathname);
  }

  return {
    SEMANTIC_FEED_ROOT_XPATH,
    CONTENT_TARGET_SELECTOR,
    normalizeInstagramPath,
    isComposerPath,
    findInstagramFeedRoot,
    getViewportRect,
    getVisibleArea,
    extractLinkFromNode,
    resolveSignatureFromHref,
    resolveElementContentSignature,
    collectVisibleCandidates,
    resolveVisibleContentSignature,
    resolveContentSignature,
  };
});
