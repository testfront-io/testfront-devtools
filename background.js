/* global chrome */

/**
 * Handle devtool connections.
 */
const devToolConnections = {}

chrome.runtime.onConnect.addListener((devToolConnection) => {
  const listener = (message, sender, sendResponse) => {
    switch (message.command) {
      case `init`:
        devToolConnections[message.tabId] = devToolConnection
        chrome.tabs.executeScript(message.tabId, { file: `content.js` })
        return

      default:
        return console.warn(`Unrecognized command:`, message)
    }
  }

  devToolConnection.onMessage.addListener(listener)

  devToolConnection.onDisconnect.addListener((devToolConnection) => {
    devToolConnection.onMessage.removeListener(listener)

    for (let tabId in devToolConnections) {
      if (devToolConnections[tabId] === devToolConnection) {
        delete devToolConnections[tabId]
      }
    }
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
