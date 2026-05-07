(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.EarnDoomOverlay = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_POSITION = { x: 24, y: 24 };

  function createCounterOverlay(options) {
    const config = options || {};
    const document = config.document;
    const initialState = config.initialState || {};
    const onPositionChange = typeof config.onPositionChange === 'function' ? config.onPositionChange : function () {};
    const onManualRecovery = typeof config.onManualRecovery === 'function' ? config.onManualRecovery : function () {};

    if (!document || typeof document.createElement !== 'function') {
      throw new TypeError('createCounterOverlay expects a document');
    }

    const root = document.createElement('section');
    const label = document.createElement('div');
    const subtitle = document.createElement('div');
    const blockedBadge = document.createElement('div');
    const recoveryButton = document.createElement('button');
    const header = document.createElement('div');

    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    root.className = 'earn-doom-overlay';
    root.style.position = 'fixed';
    root.style.zIndex = '2147483647';
    root.style.top = `${DEFAULT_POSITION.y}px`;
    root.style.right = `${DEFAULT_POSITION.x}px`;
    root.style.left = 'auto';
    root.style.bottom = 'auto';
    root.style.cursor = 'grab';
    root.style.userSelect = 'none';
    root.style.padding = '12px 14px';
    root.style.borderRadius = '14px';
    root.style.fontFamily = 'system-ui, sans-serif';
    root.style.fontSize = '14px';
    root.style.lineHeight = '1.2';
    root.style.backdropFilter = 'blur(8px)';
    root.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.18)';

    header.style.display = 'flex';
    header.style.flexDirection = 'column';
    header.style.gap = '4px';

    label.className = 'earn-doom-overlay__count';
    label.style.fontWeight = '700';
    label.style.fontSize = '15px';

    subtitle.className = 'earn-doom-overlay__quota';
    subtitle.style.fontSize = '12px';
    subtitle.style.opacity = '0.8';

    blockedBadge.className = 'earn-doom-overlay__blocked';
    blockedBadge.style.marginTop = '8px';
    blockedBadge.style.fontSize = '12px';
    blockedBadge.style.fontWeight = '700';

    recoveryButton.className = 'earn-doom-overlay__recover';
    recoveryButton.type = 'button';
    recoveryButton.textContent = 'Recover';
    recoveryButton.style.marginTop = '8px';
    recoveryButton.style.display = 'none';
    recoveryButton.style.border = '0';
    recoveryButton.style.borderRadius = '999px';
    recoveryButton.style.padding = '6px 10px';
    recoveryButton.style.fontSize = '12px';
    recoveryButton.style.fontWeight = '700';
    recoveryButton.style.cursor = 'pointer';

    header.appendChild(label);
    header.appendChild(subtitle);
    header.appendChild(blockedBadge);
    header.appendChild(recoveryButton);
    root.appendChild(header);
    document.body.appendChild(root);

    function setPosition(position) {
      const nextPosition = position && Number.isFinite(position.x) && Number.isFinite(position.y)
        ? position
        : DEFAULT_POSITION;

      root.style.left = `${nextPosition.x}px`;
      root.style.top = `${nextPosition.y}px`;
      root.style.right = 'auto';
      root.style.bottom = 'auto';
    }

    function render(state) {
      const currentState = state || {};
      label.textContent = `${currentState.currentCount || 0} / ${currentState.quota || 0}`;
      subtitle.textContent = 'Pieces of content consumed';
      blockedBadge.textContent = currentState.blocked ? 'Doom reached, create content to unlock more brain rot' : '';
      recoveryButton.style.display = currentState.blocked ? 'inline-flex' : 'none';

      if (currentState.blocked) {
        root.style.background = 'rgba(20, 20, 20, 0.9)';
        root.style.color = '#f4f4f4';
      } else {
        root.style.background = 'rgba(255, 255, 255, 0.9)';
        root.style.color = '#111111';
      }

      if (currentState.overlayPosition) {
        setPosition(currentState.overlayPosition);
      }
    }

    function handleRecoveryClick(event) {
      onManualRecovery();
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
    }

    function handlePointerDown(event) {
      dragging = true;
      const box = root.getBoundingClientRect();
      dragOffsetX = event.clientX - box.left;
      dragOffsetY = event.clientY - box.top;
      root.style.cursor = 'grabbing';
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
    }

    function handlePointerMove(event) {
      if (!dragging) {
        return;
      }

      const nextPosition = {
        x: Math.round(event.clientX - dragOffsetX),
        y: Math.round(event.clientY - dragOffsetY),
      };
      setPosition(nextPosition);
    }

    function handlePointerUp(event) {
      if (!dragging) {
        return;
      }

      dragging = false;
      root.style.cursor = 'grab';
      const nextPosition = {
        x: Math.round(parseFloat(root.style.left) || DEFAULT_POSITION.x),
        y: Math.round(parseFloat(root.style.top) || DEFAULT_POSITION.y),
      };
      onPositionChange(nextPosition);
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
    }

    root.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    recoveryButton.addEventListener('click', handleRecoveryClick);

    render(initialState);

    return {
      root,
      render,
      setPosition,
      destroy() {
        if (typeof root.removeEventListener === 'function') {
          root.removeEventListener('pointerdown', handlePointerDown);
        }
        if (typeof document.removeEventListener === 'function') {
          document.removeEventListener('pointermove', handlePointerMove);
          document.removeEventListener('pointerup', handlePointerUp);
        }
        if (typeof recoveryButton.removeEventListener === 'function') {
          recoveryButton.removeEventListener('click', handleRecoveryClick);
        }
        if (root.parentNode) {
          const index = root.parentNode.children.indexOf(root);
          if (index >= 0) {
            root.parentNode.children.splice(index, 1);
          }
        }
      },
    };
  }

  return {
    createCounterOverlay,
  };
});
