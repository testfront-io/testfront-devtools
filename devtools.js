/* global chrome */

/**
 * Create the panel in devtools.
 */
chrome.devtools.panels.create(
  `TestFront`,
  `build/images/check-16.png`,
  `build/index.html`
)
