const test = require('node:test');
const assert = require('node:assert/strict');
const stateCore = require('../src/shared/state-core.js');
const controller = require('../src/content/content-controller.js');

function createMemoryStorage(initialState = {}) {
  const data = { ...initialState };

  return {
    async get(key) {
      return { [key]: data[key] };
    },

    async set(nextValues) {
      Object.assign(data, nextValues);
    },

    snapshot() {
      return { ...data };
    },
  };
}

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
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
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
    getBoundingClientRect() {
      return { left: 24, top: 24, width: 180, height: 72 };
    },
  };

  return element;
}

function createFakeDocument() {
  const listeners = {};
  const body = createFakeElement('body');
  const contentLink = {
    href: 'https://www.instagram.com/p/first/',
    closest(selector) {
      return selector === 'a[href]' ? this : null;
    },
  };

  return {
    body,
    contentLink,
    createElement(tagName) {
      return createFakeElement(tagName);
    },
    querySelector(selector) {
      if (selector === 'a[href*="/p/"]' || selector === 'a[href*="/reel/"]' || selector === 'a[href*="/stories/"]') {
        return contentLink;
      }
      return null;
    },
    addEventListener(type, handler) {
      if (!listeners[type]) {
        listeners[type] = [];
      }
      listeners[type].push(handler);
    },
    dispatchEvent(event) {
      const handlers = listeners[event.type] || [];
      let lastResult;
      for (const handler of handlers) {
        lastResult = handler(event);
      }
      return lastResult;
    },
  };
}

function createFakeWindow() {
  const listeners = {};

  return {
    location: {
      href: 'https://www.instagram.com/',
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
    setTimeout(handler) {
      return handler();
    },
    clearTimeout() {},
  };
}

test('increments the counter when content signatures change', async () => {
  const storage = createMemoryStorage();
  const stateStore = stateCore.createStateStore(storage, { randomFn: () => 0.1, nowFn: () => 1000 });
  await stateStore.ensure();

  const renders = [];
  const fakeOverlay = {
    root: createFakeElement('section'),
    render(state) {
      renders.push({ currentCount: state.currentCount, quota: state.quota });
    },
    setBlocked() {},
    setPosition() {},
    destroy() {},
  };

  const fakeDocument = createFakeDocument();
  const fakeWindow = createFakeWindow();

  const app = await controller.createContentController({
    window: fakeWindow,
    document: fakeDocument,
    stateStore,
    overlayFactory() {
      return fakeOverlay;
    },
  });

  assert.equal(fakeDocument.body.children.length, 1);
  assert.deepEqual(renders[0], { currentCount: 0, quota: 6 });

  await app.recordContentAdvance(fakeDocument.contentLink);

  assert.equal(storage.snapshot()[stateCore.STORAGE_KEY].currentCount, 1);
  assert.deepEqual(renders[renders.length - 1], { currentCount: 1, quota: 6 });

  app.destroy();
});

test('persists overlay position changes through the state store', async () => {
  const storage = createMemoryStorage();
  const stateStore = stateCore.createStateStore(storage, { randomFn: () => 0.1, nowFn: () => 1000 });
  await stateStore.ensure();

  let dragCallback;
  const fakeOverlay = {
    root: createFakeElement('section'),
    render() {},
    setBlocked() {},
    setPosition() {},
    destroy() {},
  };

  const fakeDocument = createFakeDocument();
  const fakeWindow = createFakeWindow();

  await controller.createContentController({
    window: fakeWindow,
    document: fakeDocument,
    stateStore,
    overlayFactory(options) {
      dragCallback = options.onPositionChange;
      return fakeOverlay;
    },
  });

  await dragCallback({ x: 90, y: 140 });

  assert.deepEqual(storage.snapshot()[stateCore.STORAGE_KEY].overlayPosition, { x: 90, y: 140 });
});

test('counts visible feed layout changes without a click', async () => {
  const storage = createMemoryStorage();
  const stateStore = stateCore.createStateStore(storage, { randomFn: () => 0.1, nowFn: () => 1000 });
  await stateStore.ensure();

  const firstVisiblePost = {
    href: 'https://www.instagram.com/p/first/',
    closest(selector) {
      return selector === 'a[href]' ? this : null;
    },
    getBoundingClientRect() {
      return { left: 16, top: 16, right: 316, bottom: 316, width: 300, height: 300 };
    },
  };

  const secondVisiblePost = {
    href: 'https://www.instagram.com/p/second/',
    closest(selector) {
      return selector === 'a[href]' ? this : null;
    },
    getBoundingClientRect() {
      return { left: 16, top: 16, right: 316, bottom: 316, width: 300, height: 300 };
    },
  };

  let visiblePost = firstVisiblePost;
  const feedRoot = {
    querySelectorAll(selector) {
      if (selector.includes('/p/') || selector.includes('article')) {
        return [visiblePost];
      }

      return [];
    },
  };

  const fakeDocument = {
    body: createFakeElement('body'),
    documentElement: {
      clientWidth: 1280,
      clientHeight: 900,
    },
    createElement: createFakeElement,
    querySelector(selector) {
      if (selector === 'main' || selector === 'section main') {
        return feedRoot;
      }

      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
  };

  const fakeWindow = {
    location: {
      href: 'https://www.instagram.com/',
    },
    innerWidth: 1280,
    innerHeight: 900,
    addEventListener() {},
    removeEventListener() {},
  };

  const fakeOverlay = {
    root: createFakeElement('section'),
    render() {},
    setBlocked() {},
    setPosition() {},
    destroy() {},
  };

  const app = await controller.createContentController({
    window: fakeWindow,
    document: fakeDocument,
    stateStore,
    overlayFactory() {
      return fakeOverlay;
    },
  });

  visiblePost = secondVisiblePost;
  await app.recordContentAdvance(null);

  assert.equal(storage.snapshot()[stateCore.STORAGE_KEY].currentCount, 1);

  app.destroy();
});

test('suppresses the block mask while the composer is active', async () => {
  const storage = createMemoryStorage();
  const stateStore = stateCore.createStateStore(storage, { randomFn: () => 0.1, nowFn: () => 1000 });
  await stateStore.ensure();
  await stateStore.save({
    ...(await stateStore.load()),
    currentCount: 1,
    quota: 1,
    blocked: true,
  });

  const maskStates = [];
  const fakeOverlay = {
    root: createFakeElement('section'),
    render() {},
    setBlocked() {},
    setPosition() {},
    destroy() {},
  };

  const fakeDocument = createFakeDocument();
  const fakeWindow = createFakeWindow();

  const app = await controller.createContentController({
    window: fakeWindow,
    document: fakeDocument,
    stateStore,
    overlayFactory() {
      return fakeOverlay;
    },
    maskFactory() {
      return {
        setBlocked(blocked) {
          maskStates.push(blocked);
        },
        show() {},
        hide() {},
        destroy() {},
      };
    },
    composerStateResolver() {
      return true;
    },
  });

  assert.equal(maskStates[0], false);

  await app.recordContentAdvance(fakeDocument.contentLink);

  assert.equal(storage.snapshot()[stateCore.STORAGE_KEY].currentCount, 1);
  app.destroy();
});

test('resets the cycle after publishing a post', async () => {
  let randomCalls = 0;
  const storage = createMemoryStorage();
  const stateStore = stateCore.createStateStore(storage, {
    randomFn() {
      randomCalls += 1;
      return randomCalls === 1 ? 0.1 : 0.8;
    },
    nowFn: () => 1000,
  });
  await stateStore.ensure();
  await stateStore.save({
    ...(await stateStore.load()),
    currentCount: 1,
    quota: 1,
    blocked: true,
    overlayPosition: { x: 111, y: 222 },
  });

  const maskStates = [];
  const fakeOverlay = {
    root: createFakeElement('section'),
    render() {},
    setBlocked() {},
    setPosition() {},
    destroy() {},
  };

  const fakeDocument = createFakeDocument();
  const fakeWindow = createFakeWindow();

  const app = await controller.createContentController({
    window: fakeWindow,
    document: fakeDocument,
    stateStore,
    overlayFactory() {
      return fakeOverlay;
    },
    maskFactory() {
      return {
        setBlocked(blocked) {
          maskStates.push(blocked);
        },
        show() {},
        hide() {},
        destroy() {},
      };
    },
    composerStateResolver() {
      return true;
    },
    publishActionResolver(target) {
      return Boolean(target && typeof target.closest === 'function' && target.closest('button[type="submit"]'));
    },
  });

  const publishTarget = {
    textContent: 'Post',
    closest(selector) {
      return selector === 'button[type="submit"]' ? this : null;
    },
  };

  await app.recordPublishCompletion(publishTarget);

  const savedState = storage.snapshot()[stateCore.STORAGE_KEY];
  assert.equal(savedState.currentCount, 0);
  assert.equal(savedState.blocked, false);
  assert.equal(savedState.quota, 13);
  assert.deepEqual(savedState.overlayPosition, { x: 111, y: 222 });
  assert.equal(maskStates[maskStates.length - 1], false);

  app.destroy();
});
test('manual recovery reset records diagnostics and restores a fresh cycle', async () => {
  let randomCalls = 0;
  const storage = createMemoryStorage();
  const stateStore = stateCore.createStateStore(storage, {
    randomFn() {
      randomCalls += 1;
      return randomCalls === 1 ? 0.1 : 0.8;
    },
    nowFn: () => 1000,
  });
  await stateStore.ensure();
  await stateStore.save({
    ...(await stateStore.load()),
    currentCount: 1,
    quota: 1,
    blocked: true,
    overlayPosition: { x: 33, y: 44 },
  });

  const diagnosticsEvents = [];
  const fakeOverlay = {
    root: createFakeElement('section'),
    render() {},
    setBlocked() {},
    setPosition() {},
    destroy() {},
  };

  const fakeDocument = createFakeDocument();
  const fakeWindow = createFakeWindow();

  const app = await controller.createContentController({
    window: fakeWindow,
    document: fakeDocument,
    stateStore,
    overlayFactory() {
      return fakeOverlay;
    },
    maskFactory() {
      return {
        setBlocked() {},
        show() {},
        hide() {},
        destroy() {},
      };
    },
    composerStateResolver() {
      return true;
    },
    diagnostics: {
      async record(type, details) {
        diagnosticsEvents.push({ type, details });
      },
    },
  });

  await app.manualRecoveryReset();

  const savedState = storage.snapshot()[stateCore.STORAGE_KEY];
  assert.equal(savedState.currentCount, 0);
  assert.equal(savedState.blocked, false);
  assert.equal(savedState.quota, 13);
  assert.equal(diagnosticsEvents[diagnosticsEvents.length - 1].type, 'manual_recovery');

  app.destroy();
});
