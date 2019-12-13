/* global chrome */

/**
 * Simple wrapper for sending/receiving messages to/from the content script in the current tab.
 */
const tab = {
  sendMessage: (message, callback) => {
    try {
      chrome.devtools.inspectedWindow.eval(
        `handleDevToolsMessage(${JSON.stringify(message)})`,
        { useContentScriptContext: true },
        callback
      )
    } catch (error) {
      console.error(`devtools tab.sendMessage error:`, error)
    }
  },

  onMessage: (listener) => {
    try {
      chrome.runtime.onMessage.addListener(listener)
    } catch (error) {
      console.error(`devtools tab.onMessage error:`, error)
    }
  }
}

export default tab
