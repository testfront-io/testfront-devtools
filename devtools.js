/* global chrome */

/**
 * Initialize the background connection.
 */
const backgroundConnection = chrome.runtime.connect({
  name: `devtools-panel`
})

backgroundConnection.postMessage({
  tabId: chrome.devtools.inspectedWindow.tabId,
  command: `init`
})

/**
 * Create the panel in devtools.
 */
chrome.devtools.panels.create(
  `TestFront`,
  `build/images/check-16.png`,
  `build/index.html`
)
