/* global chrome */
const eventListeners = {}

let isRecording = false
let isTesting = false

let snapshotSelector = `html`
let snapshotHtml = ``

let recordedIndex = 0
let recorded = []

const timeouts = {
  simulateEvent: -1,
  compareHtml: -1
}

const timeLimits = {
  simulateEvent: 2000,
  compareHtml: 2000
}

/**
 * Clears the provided timeout `keys` and resets to -1.
 * @param {array} keys
 */
const clearTimeouts = (keys = Object.keys(timeouts)) => {
  for (let key of keys) {
    clearTimeout(timeouts[key])
    timeouts[key] = -1
  }
}

/**
 * Track document mutations.
 */
let documentHasMutated = true
const documentObserver = new MutationObserver(() => documentHasMutated = true)
documentObserver.observe(document.documentElement,  { attributes: true, childList: true, subtree: true })

/**
 * Main loop for handling current state and relaying to devtools.
 */
const main = () => {
  if (isRecording) {
    record()
  } else if (isTesting) {
    test()
  }

  window.requestAnimationFrame(main)
}
window.requestAnimationFrame(main)

/**
 * Gets the path to some element as a selector.
 * @param {element} element
 * @returns {string}
 */
const getTargetSelector = (element) => {
  const snapshotContainer = document.querySelector(snapshotSelector)
  const targetSelector = []
  let i = 0
  let n = 1

  while (element.parentNode !== null) {
    i = 0
    n = 1

    while (element.parentNode.childNodes[i] && element.parentNode.childNodes[i] !== element) {
      if (element.parentNode.childNodes[i] instanceof Element) {
        n++
      }

      i++
    }

    targetSelector.unshift(`${element.nodeName.toLowerCase()}:nth-child(${n})`)
    element = element.parentNode

    if (element === snapshotContainer) {
      targetSelector.unshift(snapshotSelector)
      break
    }
  }

  return targetSelector.join(` > `)
}

/**
 * Some events need special listeners.
 */
const specialEventListeners = {
  input: event => {
    const eventType = `input`
    const targetSelector = getTargetSelector(event.target)
    const value = event.target.value || ``

    if (targetSelector) {
      chrome.runtime.sendMessage({ command: `pushRecordedItem`, recordedItem: { eventType, targetSelector, value } })
    }
  },

  change: event => {
    const eventType = `change`
    const targetSelector = getTargetSelector(event.target)
    const value = event.target.value || ``

    if (targetSelector) {
      chrome.runtime.sendMessage({ command: `pushRecordedItem`, recordedItem: { eventType, targetSelector, value } })
    }
  }
}

/**
 * Adds an event listener for the provided `eventType` and sends the `eventType` and `targetSelector` when triggered.
 * @param {string} eventType
 */
const addEventListener = eventType => {
  if (specialEventListeners[eventType]) {
    eventListeners[eventType] = specialEventListeners[eventType]
  } else {
    eventListeners[eventType] = (event) => {
      const targetSelector = getTargetSelector(event.target)

      if (targetSelector) {
        chrome.runtime.sendMessage({ command: `pushRecordedItem`, recordedItem: { eventType, targetSelector } })
      }
    }
  }

  document.addEventListener(eventType, eventListeners[eventType], true)
}

/**
 * Removes the existing event listener for the provided `eventType`.
 * @param {string} eventType
 */
const removeEventListener = eventType => {
  if (eventListeners[eventType]) {
    document.removeEventListener(eventType, eventListeners[eventType], true)
    delete eventListeners[eventType]
  }
}

/**
 * Sets event listeners for the provided `eventTypes`.
 * @param {array} eventTypes
 */
const setEventListeners = eventTypes => {
  for (let eventType in eventListeners) {
    removeEventListener(eventType)
  }

  for (let eventType of eventTypes) {
    addEventListener(eventType)
  }
}

/**
 * Sends the snapshot `html` to devtools, if changed.
 */
const record = () => {
  if (!documentHasMutated) {
    return
  }
  documentHasMutated = false

  const html = document.querySelector(snapshotSelector).innerHTML

  if (html !== snapshotHtml) {
    snapshotHtml = html
    chrome.runtime.sendMessage({ command: `pushRecordedItem`, recordedItem: { html } })
  }
}

/**
 * Starts recording snapshots and events based on the provided `message.snapshotSelector` and `message.eventTypes`.
 * @param {object} message
 */
const startRecording = (message) => {
  const html = document.querySelector(message.snapshotSelector).innerHTML

  chrome.runtime.sendMessage({ command: `pushRecordedItem`, recordedItem: { html } })
  snapshotSelector = message.snapshotSelector
  snapshotHtml = html
  isRecording = true
  isTesting = false
  clearTimeouts()
  setEventListeners(message.eventTypes)
}

/**
 * Stops recording by clearing event listeners and timeouts.
 */
const stopRecording = () => {
  const html = document.querySelector(snapshotSelector).innerHTML

  snapshotHtml = html
  isRecording = false
  clearTimeouts()
  setEventListeners([])
  chrome.runtime.sendMessage({ command: `stopRecording` })
}

/**
 * Some events need special simulation. Each simulator should return the target `element`.
 */
const specialEventSimulator = {
  input: ({ targetSelector, value }) => {
    const element = document.querySelector(targetSelector)

    if (element) {
      element.setAttribute(`value`, value)
    }

    return element
  },

  change: ({ targetSelector, value }) => {
    const element = document.querySelector(targetSelector)

    if (element) {
      element.setAttribute(`value`, value)
    }

    return element
  }
}

/**
 * Simulates an event on the target element.
 * @param {object} recordedItem
 * @returns {boolean} `true` if the event was successfully simulated
 */
const simulateEvent = recordedItem => {
  const { eventType, targetSelector } = recordedItem
  const element = specialEventSimulator[eventType]
    ? specialEventSimulator[eventType](recordedItem)
    : document.querySelector(targetSelector)

  if (!element) {
    console.warn(`TestFront could not find element:`, { eventType, targetSelector })
    return false
  }

  if (typeof element[eventType] === `function`) {  // TODO should we actually do it this way?
    console.log(`simulatedEvent by element.${eventType}() for`, { recordedItem })
    element[eventType]()
    return true
  }

  let event

  if (document.createEvent) {
    event = document.createEvent(`HTMLEvents`)
    event.initEvent(eventType, true, true)
    event.eventName = eventType
    element.dispatchEvent(event)
  } else {
    event = document.createEventObject()
    event.eventName = eventType
    event.eventType = eventType
    element.fireEvent(`on${event.eventType}`, event);
  }

  return true
}

/**
 * Tests the `recorded` array of events and html.
 */
const test = () => {
  const recordedItem = recorded[recordedIndex]

  if (!recordedItem) {
    stopTest()
    return
  }

  if (typeof recordedItem.html !== `undefined`) {
    snapshotHtml = document.querySelector(snapshotSelector).innerHTML

    if (snapshotHtml === recordedItem.html) {
      chrome.runtime.sendMessage({ command: `testItemPassed`, recordedIndex })
      clearTimeouts([`compareHtml`])
      recordedIndex++
    } else if (timeouts.compareHtml < 0) {
      timeouts.compareHtml = setTimeout(() => {
        chrome.runtime.sendMessage({ command: `testItemFailed`, recordedIndex, error: { html: snapshotHtml } })
        timeouts.compareHtml = -1
        stopTest()
      }, timeLimits.compareHtml)
    }
  } else {
    if (simulateEvent(recordedItem)) {
      chrome.runtime.sendMessage({ command: `testItemPassed`, recordedIndex })
      clearTimeouts([`simulateEvent`])
      recordedIndex++
    } else if (timeouts.simulateEvent < 0) {
      timeouts.simulateEvent = setTimeout(() => {
        chrome.runtime.sendMessage({ command: `testItemFailed`, recordedIndex })
        timeouts.simulateEvent = -1
        stopTest()
      }, timeLimits.simulateEvent)
    }
  }
}

/**
 * Starts the test.
 * @param {object} message
 */
const startTest = (message) => {
  recordedIndex = 0
  recorded = message.recorded
  snapshotSelector = message.snapshotSelector
  snapshotHtml = document.querySelector(snapshotSelector).innerHTML
  clearTimeouts()
  isRecording = false
  isTesting = true
}

/**
 * Stops the test.
 */
const stopTest = () => {
  clearTimeouts()
  isTesting = false
  chrome.runtime.sendMessage({ command: `stopTest` })
}

/**
 * Handle messages from devtools.
 */
// eslint-disable-next-line no-unused-vars
const handleDevToolsMessage = (message) => {
  switch (message.command) {
    case `startRecording`:
      return startRecording(message)

    case `stopRecording`:
      return stopRecording()

    case `startTest`:
      return startTest(message)

    case `stopTest`:
      return stopTest()

    case `consoleLog`:
      return console.log(message)

    default:
      return console.warn(`Unrecognized command:`, message)
  }
}
