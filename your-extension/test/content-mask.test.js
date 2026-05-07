const test = require('node:test');
const assert = require('node:assert/strict');
const mask = require('../src/content/content-mask.js');

function createElement(tagName, rect) {
  const listeners = {};
  const element = {
    tagName: tagName.toUpperCase(),
    children: [],
    style: {},
    parentNode: null,
    getBoundingClientRect() {
      return rect;
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
    },
    setAttribute() {},
    addEventListener(type, handler) {
      if (!listeners[type]) {
        listeners[type] = [];
      }
      listeners[type].push(handler);
    },
    dispatchEvent(event) {
      for (const handler of listeners[event.type] || []) {
        handler(event);
      }
    },
  };

  return element;
}

function createDocument(targets) {
  const body = createElement('body', { left: 0, top: 0, width: 0, height: 0 });
  const created = [];

  return {
    body,
    created,
    createElement(tagName) {
      const element = createElement(tagName, { left: 0, top: 0, width: 0, height: 0 });
      created.push(element);
      return element;
    },
    querySelectorAll(selector) {
      if (selector === mask.TARGET_SELECTOR) {
        return targets;
      }
      return [];
    },
  };
}

test('masks only content media targets and leaves controls alone', () => {
  const articleImage = createElement('img', { left: 20, top: 30, width: 200, height: 140 });
  const articleVideo = createElement('video', { left: 260, top: 30, width: 220, height: 140 });
  const createButton = createElement('button', { left: 520, top: 30, width: 80, height: 40 });
  const document = createDocument([articleImage, articleVideo]);
  const manager = mask.createContentMask({
    document,
    themeResolver() {
      return 'dark';
    },
  });

  manager.setBlocked(true);

  assert.equal(document.created.length, 2);
  assert.equal(document.created[0].style.background, 'rgba(16, 16, 16, 0.92)');
  assert.equal(document.created[0].style.left, '20px');
  assert.equal(document.created[0].style.width, '200px');
  assert.equal(createButton.children.length, 0);

  manager.setBlocked(false);
  assert.equal(document.body.children.length, 0);
});
