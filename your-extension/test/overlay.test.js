const test = require('node:test');
const assert = require('node:assert/strict');
const overlay = require('../src/content/overlay.js');

function createFakeElement(tagName) {
  const listeners = {};
  let textValue = '';
  const element = {
    tagName: tagName.toUpperCase(),
    children: [],
    style: {},
    parentNode: null,
    get textContent() {
      const childText = this.children.map((child) => child.textContent || '').join('');
      return `${textValue}${childText}`;
    },
    set textContent(value) {
      textValue = String(value);
    },
    addEventListener(type, handler) {
      if (!listeners[type]) {
        listeners[type] = [];
      }
      listeners[type].push(handler);
    },
    dispatchEvent(event) {
      const handlers = listeners[event.type] || [];
      for (const handler of handlers) {
        handler(event);
      }
      return true;
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
    },
    getBoundingClientRect() {
      return { left: 24, top: 24, width: 180, height: 72 };
    },
  };

  return element;
}

function createFakeDocument() {
  const listeners = {};
  const body = createFakeElement('body');

  return {
    body,
    createElement(tagName) {
      return createFakeElement(tagName);
    },
    addEventListener(type, handler) {
      if (!listeners[type]) {
        listeners[type] = [];
      }
      listeners[type].push(handler);
    },
    dispatchEvent(event) {
      const handlers = listeners[event.type] || [];
      for (const handler of handlers) {
        handler(event);
      }
    },
  };
}

test('renders a draggable counter overlay', () => {
  const document = createFakeDocument();
  const positions = [];
  const view = overlay.createCounterOverlay({
    document,
    initialState: {
      currentCount: 2,
      quota: 10,
      overlayPosition: { x: 24, y: 24 },
      blocked: false,
    },
    onPositionChange(position) {
      positions.push(position);
    },
  });

  assert.equal(document.body.children.length, 1);
  assert.match(view.root.textContent, /2\s*\/\s*10/);
  assert.equal(view.root.style.top, '24px');

  view.root.dispatchEvent({
    type: 'pointerdown',
    clientX: 30,
    clientY: 30,
    preventDefault() {},
  });
  document.dispatchEvent({
    type: 'pointermove',
    clientX: 60,
    clientY: 72,
    preventDefault() {},
  });
  document.dispatchEvent({
    type: 'pointerup',
    clientX: 60,
    clientY: 72,
    preventDefault() {},
  });

  assert.equal(positions.length, 1);
  assert.deepEqual(positions[0], { x: 54, y: 66 });
});

test('shows a recovery action when blocked', () => {
  const document = createFakeDocument();
  let recoveryCount = 0;
  const view = overlay.createCounterOverlay({
    document,
    initialState: {
      currentCount: 10,
      quota: 10,
      overlayPosition: { x: 24, y: 24 },
      blocked: true,
    },
    onPositionChange() {},
    onManualRecovery() {
      recoveryCount += 1;
    },
  });

  const recoveryButton = view.root.children[0].children[3];
  assert.equal(recoveryButton.style.display, 'inline-flex');
  recoveryButton.dispatchEvent({
    type: 'click',
    preventDefault() {},
  });
  assert.equal(recoveryCount, 1);
});
