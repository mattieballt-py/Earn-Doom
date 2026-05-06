importScripts('../shared/state-core.js');

const stateCore = self.EarnDoomStateCore;
const stateStore = stateCore.createStateStore(chrome.storage.local);

chrome.runtime.onInstalled.addListener(async () => {
  await stateStore.ensure();
});

chrome.runtime.onStartup.addListener(async () => {
  await stateStore.ensure();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') {
    return false;
  }

  if (message.type === 'earnDoom:getState') {
    stateStore.load().then(sendResponse);
    return true;
  }

  if (message.type === 'earnDoom:resetState') {
    stateStore.reset().then(sendResponse);
    return true;
  }

  if (message.type === 'earnDoom:ensureState') {
    stateStore.ensure().then(sendResponse);
    return true;
  }

  return false;
});
