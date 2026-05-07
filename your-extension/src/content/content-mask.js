(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.EarnDoomContentMask = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const TARGET_SELECTOR = 'article img, article video, [role="dialog"] img, [role="dialog"] video';

  function createContentMask(options) {
    const config = options || {};
    const document = config.document;
    const themeResolver = typeof config.themeResolver === 'function'
      ? config.themeResolver
      : function () {
        return 'light';
      };

    if (!document || typeof document.createElement !== 'function' || typeof document.querySelectorAll !== 'function') {
      throw new TypeError('createContentMask expects a document with DOM APIs');
    }

    const masks = new Map();

    function getThemeColor() {
      return themeResolver() === 'dark'
        ? 'rgba(16, 16, 16, 0.92)'
        : 'rgba(255, 255, 255, 0.92)';
    }

    function createMaskForTarget(target) {
      const rect = target.getBoundingClientRect();
      const mask = document.createElement('div');
      mask.className = 'earn-doom-content-mask';
      mask.style.position = 'fixed';
      mask.style.left = `${Math.round(rect.left)}px`;
      mask.style.top = `${Math.round(rect.top)}px`;
      mask.style.width = `${Math.round(rect.width)}px`;
      mask.style.height = `${Math.round(rect.height)}px`;
      mask.style.zIndex = '2147483646';
      mask.style.pointerEvents = 'none';
      mask.style.background = getThemeColor();
      mask.setAttribute('aria-hidden', 'true');

      if (target.parentNode && typeof target.parentNode.appendChild === 'function') {
        target.parentNode.appendChild(mask);
      } else if (document.body && typeof document.body.appendChild === 'function') {
        document.body.appendChild(mask);
      }

      masks.set(target, mask);
    }

    function clearMasks() {
      for (const mask of masks.values()) {
        if (mask.parentNode && Array.isArray(mask.parentNode.children)) {
          const index = mask.parentNode.children.indexOf(mask);
          if (index >= 0) {
            mask.parentNode.children.splice(index, 1);
          }
        }
      }
      masks.clear();
    }

    function render() {
      const targets = Array.from(document.querySelectorAll(TARGET_SELECTOR));
      const targetSet = new Set(targets);

      for (const [target, mask] of masks.entries()) {
        if (!targetSet.has(target)) {
          if (mask.parentNode && Array.isArray(mask.parentNode.children)) {
            const index = mask.parentNode.children.indexOf(mask);
            if (index >= 0) {
              mask.parentNode.children.splice(index, 1);
            }
          }
          masks.delete(target);
        }
      }

      for (const target of targets) {
        if (!masks.has(target)) {
          createMaskForTarget(target);
        }
      }
    }

    return {
      show() {
        render();
      },
      hide() {
        clearMasks();
      },
      setBlocked(blocked) {
        if (blocked) {
          render();
          return;
        }
        clearMasks();
      },
      destroy() {
        clearMasks();
      },
    };
  }

  return {
    TARGET_SELECTOR,
    createContentMask,
  };
});
