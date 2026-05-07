const test = require('node:test');
const assert = require('node:assert/strict');
const publishState = require('../src/content/publish-state.js');

function createTarget(matchSelector, textContent = '') {
  return {
    textContent,
    closest(selector) {
      return selector === matchSelector ? this : null;
    },
  };
}

test('detects publish controls from buttons and labels', () => {
  assert.equal(
    publishState.isPublishActionTarget(createTarget('button[type="submit"]')),
    true
  );

  assert.equal(
    publishState.isPublishActionTarget({ textContent: 'Share', closest() { return null; } }),
    true
  );
});

test('ignores non-publish controls', () => {
  assert.equal(
    publishState.isPublishActionTarget({ textContent: 'Cancel', closest() { return null; } }),
    false
  );
});
