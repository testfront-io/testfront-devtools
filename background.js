/* global chrome */

/**
 * Handle devtool connections.
 */
const devToolConnections = {}

chrome.runtime.onConnect.addListener((devToolConnection) => {
  let tabId = -1
  const listener = (message, sender, sendResponse) => {
    switch (message.command) {
      case `initialize`:
        tabId = message.tabId
        devToolConnections[tabId] = devToolConnection
        chrome.tabs.executeScript(tabId, { file: `content.js` })
      return

      default:
        console.warn(`Unrecognized command:`, message)
      return
    }
  }

  devToolConnection.onMessage.addListener(listener)

  devToolConnection.onDisconnect.addListener((devToolConnection) => {
    devToolConnection.onMessage.removeListener(listener)
    delete devToolConnections[tabId]
  })
})

/**
 * Pass messages from content script to devtools.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.tab) {
    const tabId = sender.tab.id

    if (tabId in devToolConnections) {
      devToolConnections[tabId].postMessage(message)
    }
  }

  return true
})

/**
 * Delete connection when removed or replaced.
 */
chrome.tabs.onRemoved.addListener(tabId => {
  delete devToolConnections[tabId]
})

chrome.tabs.onReplaced.addListener((newTabId, tabId) => {
  delete devToolConnections[tabId]
})
