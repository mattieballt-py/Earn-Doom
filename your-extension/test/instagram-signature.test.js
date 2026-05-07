const test = require('node:test');
const assert = require('node:assert/strict');
const signature = require('../src/content/instagram-signature.js');

function createLink(href) {
  return {
    href,
    closest(selector) {
      return selector === 'a[href]' ? this : null;
    },
  };
}

test('resolves content signatures from Instagram content links', () => {
  assert.equal(
    signature.resolveContentSignature({
      locationHref: 'https://www.instagram.com/p/abc123/?utm_source=feed',
    }),
    'post:/p/abc123'
  );

  assert.equal(
    signature.resolveContentSignature({
      locationHref: 'https://www.instagram.com/reel/xyz789/?igsh=1',
    }),
    'reel:/reel/xyz789'
  );

  assert.equal(
    signature.resolveContentSignature({
      target: createLink('https://www.instagram.com/stories/user/1234567890/'),
      locationHref: 'https://www.instagram.com/',
    }),
    'story:/stories/user/1234567890'
  );
});

test('ignores composer and non-content controls', () => {
  assert.equal(
    signature.resolveContentSignature({
      target: createLink('https://www.instagram.com/create/select/'),
      locationHref: 'https://www.instagram.com/',
    }),
    null
  );
});
