let popupPort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "popup") return;
  popupPort = port;
  port.onDisconnect.addListener(() => { popupPort = null; });
});

// Relay messages from content script to popup
chrome.runtime.onMessage.addListener((msg) => {
  if (popupPort) popupPort.postMessage(msg);
});
