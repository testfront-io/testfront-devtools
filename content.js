/* global chrome */
const eventListeners = {}

let isRecording = false
let isTesting = false

let snapshotSelector = `html`
let snapshotHtml = ``

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
 * Gets the simplest element selector for some `element`.
 * @param {element} element
 * @param {array} attributes
 * @returns {string}
 */
const getSimplestElementSelector = (element, attributes = [`name`, `placeholder`]) => {
  if (element.id) {
    return `#${element.id}`
  }

  let elementSelector = ``

  for (let attribute of attributes) {
    if (element.getAttribute(attribute)) {
      elementSelector = `[${attribute}='${element.getAttribute(attribute)}']`

      if (element.parentNode.querySelector(elementSelector) !== element) {
        elementSelector = element.nodeName.toLowerCase() + elementSelector
      }

      if (element.parentNode.querySelector(elementSelector) === element) {
        return elementSelector
      }
    }
  }

  elementSelector = element.nodeName.toLowerCase()

  if (element.parentNode.querySelector(elementSelector) === element) {
    return elementSelector
  }

  let i = 0
  let n = 1

  while (element.parentNode.childNodes[i] && element.parentNode.childNodes[i] !== element) {
    if (element.parentNode.childNodes[i] instanceof Element) {
      n++
    }
    i++
  }

  return `${elementSelector}:nth-child(${n})`
}

/**
 * Gets the path to some element as a selector.
 * @param {element} element
 * @returns {string}
 */
const getTargetSelector = (element) => {
  const snapshotContainer = document.querySelector(snapshotSelector)
  const targetSelector = []

  while (element.parentNode !== null) {
    targetSelector.unshift(getSimplestElementSelector(element))

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
    const id = event.target.id || undefined
    const name = event.target.getAttribute(`name`) || undefined
    const placeholder = event.target.getAttribute(`placeholder`) || undefined

    if (targetSelector) {
      chrome.runtime.sendMessage({
        command: `pushRecordedItem`,
        recordedItem: {
          eventType,
          targetSelector,
          value,
          id,
          name,
          placeholder
        }
      })
    }
  },

  change: event => {
    const eventType = `change`
    const targetSelector = getTargetSelector(event.target)
    const value = event.target.value || ``
    const id = event.target.id || undefined
    const name = event.target.getAttribute(`name`) || undefined
    const placeholder = event.target.getAttribute(`placeholder`) || undefined

    if (targetSelector) {
      chrome.runtime.sendMessage({
        command: `pushRecordedItem`,
        recordedItem: {
          eventType,
          targetSelector,
          value,
          id,
          name,
          placeholder
        }
      })
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
        chrome.runtime.sendMessage({
          command: `pushRecordedItem`,
          recordedItem: {
            eventType,
            targetSelector
          }
        })
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

    chrome.runtime.sendMessage({
      command: `pushRecordedItem`,
      recordedItem: {
        html
      }
    })
  }
}

/**
 * Starts recording snapshots and events based on the provided `message.test`.
 * @param {object} message
 */
const startRecording = (message) => {
  const html = document.querySelector(message.test.snapshotSelector).innerHTML

  chrome.runtime.sendMessage({
    command: `pushRecordedItem`,
    recordedItem: {
      html
    }
  })

  snapshotSelector = message.test.snapshotSelector
  snapshotHtml = html
  isRecording = true
  isTesting = false
  clearTimeouts()
  setEventListeners(message.test.eventTypes)
}

/**
 * Stops recording by clearing event listeners and timeouts.
 */
const stopRecording = () => {
  snapshotHtml = document.querySelector(snapshotSelector).innerHTML
  isRecording = false
  clearTimeouts()
  setEventListeners([])
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
  const recordedItem = recorded[0]

  if (!recordedItem) {
    stopTesting()
    return
  }

  if (typeof recordedItem.html !== `undefined`) {
    snapshotHtml = document.querySelector(snapshotSelector).innerHTML

    if (snapshotHtml === recordedItem.html) {
      recorded.shift()
      clearTimeouts([`compareHtml`])

      chrome.runtime.sendMessage({
        command: `setRecordedItemResult`,
        result: {
          state: `PASSED`
        }
      })
    } else if (timeouts.compareHtml < 0) {
      timeouts.compareHtml = setTimeout(() => {
        timeouts.compareHtml = -1
        stopTesting()

        chrome.runtime.sendMessage({
          command: `setRecordedItemResult`,
          result: {
            state: `FAILED`,
            error: {
              html: snapshotHtml
            }
          }
        })
      }, timeLimits.compareHtml)
    }
  } else {
    if (simulateEvent(recordedItem)) {
      recorded.shift()
      clearTimeouts([`simulateEvent`])

      chrome.runtime.sendMessage({
        command: `setRecordedItemResult`,
        result: {
          state: `PASSED`
        }
      })
    } else if (timeouts.simulateEvent < 0) {
      timeouts.simulateEvent = setTimeout(() => {
        timeouts.simulateEvent = -1
        stopTesting()

        chrome.runtime.sendMessage({
          command: `setRecordedItemResult`,
          result: {
            state: `FAILED`,
            error: {
              message: `Target not found`
            }
          }
        })
      }, timeLimits.simulateEvent)
    }
  }
}

/**
 * Starts the test.
 * @param {object} message
 */
const startTesting = (message) => {
  recorded = message.test.recorded
  snapshotSelector = message.test.snapshotSelector
  snapshotHtml = document.querySelector(snapshotSelector).innerHTML
  clearTimeouts()
  isRecording = false
  isTesting = true
}

/**
 * Stops the test.
 */
const stopTesting = () => {
  clearTimeouts()
  isTesting = false
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
      return stopRecording(message)

    case `startTesting`:
      return startTesting(message)

    case `stopTesting`:
      return stopTesting(message)

    case `consoleLog`:
      return console.log(message)

    default:
      return console.warn(`Unrecognized command:`, message)
  }
}
