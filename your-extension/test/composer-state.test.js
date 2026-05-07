const test = require('node:test');
const assert = require('node:assert/strict');
const composerState = require('../src/content/composer-state.js');

test('detects the composer from the create route', () => {
  assert.equal(
    composerState.isComposerActive({
      locationHref: 'https://www.instagram.com/create/select/',
    }),
    true
  );
});

test('detects the composer from a dialog with text input', () => {
  assert.equal(
    composerState.isComposerActive({
      locationHref: 'https://www.instagram.com/',
      document: {
        querySelector(selector) {
          return selector === '[role="dialog"] textarea' ? {} : null;
        },
      },
    }),
    true
  );
});

test('does not report composer activity on a normal feed page', () => {
  assert.equal(
    composerState.isComposerActive({
      locationHref: 'https://www.instagram.com/',
      document: {
        querySelector() {
          return null;
        },
      },
    }),
    false
  );
});
