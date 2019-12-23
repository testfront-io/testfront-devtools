/* global chrome */

const IDLE = `IDLE`
const RECORDING = `RECORDING`
const TESTING = `TESTING`

const UNTESTED = `UNTESTED`
const PASSED = `PASSED`
const FAILED = `FAILED`

/**
 * For easier replication, this store resembles the `store` object created by `React.useState`
 * in the dev tools' `Provider` component, but it doesn't work like `React.useState`.
 * The data relevant to this content script is initialized below.
 */
let store = {
  state: IDLE,

  testGroupIndex: -1,
  testIndex: -1,
  frameIndex: -1,

  allTestGroups: false,
  allTests: false,

  data: {
    state: UNTESTED,

    testGroups: [],

    timeLimits: {
      simulateEvent: 2000,
      compareHtml: 2000
    }
  }
}

/**
 * Updates the store by extending it. Also extends `store.data` if `updates.data` is provided.
 *
 * If `store.state` is changed to RECORDING,
 * sets necessary flags to send the first snapshot
 * and sets the necessary event listeners for the current test.
 *
 * If `store.state` is changed to not RECORDING,
 * unsets the event listeners.
 */
const updateStore = updates => {
  const startRecording = store.state !== RECORDING && updates.state === RECORDING
  const stopRecording = store.state === RECORDING && updates.state && updates.state !== RECORDING

  if (updates.data) {
    updates.data = {
      ...store.data,
      ...updates.data
    }
  }

  store = {
    ...store,
    ...updates
  }

  if (startRecording) {
    currentHtml = ``
    documentHasMutated = true
    setEventListeners(
      store.data
        .testGroups[store.testGroupIndex]
        .tests[store.testIndex]
        .eventTypes
    )
  } else if (stopRecording) {
    setEventListeners([])
  }
}

/**
 * Adds the `frame` to the current test and sends the same `frame` to dev tools.
 * @param {object} frame
 */
const addFrame = frame => {
  const { state, testGroupIndex, testIndex } = store

  if (state !== RECORDING) {
    return
  }

  const data = {}
  const testGroups = [ ...store.data.testGroups ]
  const testGroup = { ...testGroups[testGroupIndex] }
  const tests = [ ...testGroup.tests ]
  const test = { ...tests[testIndex] }
  const frames = [ ...test.frames ]

  frames.push(frame)
  test.frames = frames
  tests[testIndex] = test
  testGroup.tests = tests
  testGroups[testGroupIndex] = testGroup
  data.testGroups = testGroups

  updateStore({ data })

  chrome.runtime.sendMessage({ command: `addFrame`, frame })
}

/**
 * Updates the current frame and sends the same `updates` to dev tools.
 * If `store.state` is TESTING:
 *   If `updates.state` is PASSED, increments the indexes to the next testable frame.
 *   If `updates.state` is FAILED, stops testing.
 *   Updates the frame's parent `test` and `testGroup` as necessary.
 * @param {object} updates
 */
const updateFrame = updates => {
  let { state, testGroupIndex, testIndex, frameIndex } = store
  const { allTestGroups, allTests } = store

  const data = {}
  const testGroups = [ ...store.data.testGroups ]
  const testGroup = { ...testGroups[testGroupIndex] }
  const tests = [ ...testGroup.tests ]
  const test = { ...tests[testIndex] }
  const frames = [ ...test.frames ]
  const frame = { ...frames[frameIndex], ...updates }

  const incrementFrameIndex = () => {
    frameIndex++

    if (!frames[frameIndex]) {
      test.state = PASSED

      if (tests.every(test => test.state === PASSED)) {
        testGroup.state = PASSED
      }

      if (testGroups.every(testGroup => testGroup.state === PASSED)) {
        data.state = PASSED
      }

      if (allTests) {
        frameIndex = 0
        incrementTestIndex()
      } else {
        stopTesting()
      }
    }
  }

  const incrementTestIndex = () => {
    const testGroup = testGroups[testGroupIndex]
    const tests = testGroup.tests
    const test = tests[++testIndex]

    if (!test) {
      if (allTestGroups) {
        incrementTestGroupIndex()
      } else {
        stopTesting()
      }
    } else if (test.skip || !test.frames.length) {
      incrementTestIndex()
    }
  }

  const incrementTestGroupIndex = () => {
    const testGroup = testGroups[++testGroupIndex]

    if (!testGroup) {
      stopTesting()
    } else if (testGroup.skip) {
      incrementTestGroupIndex()
    } else {
      testIndex = -1
      incrementTestIndex()
    }
  }

  const stopTesting = () => {
    state = IDLE
    testGroupIndex = -1
    testIndex = -1
    frameIndex = -1
  }

  frames[frameIndex] = frame
  test.frames = frames
  tests[testIndex] = test
  testGroup.tests = tests
  testGroups[testGroupIndex] = testGroup
  data.testGroups = testGroups

  if (state === TESTING) {
    if (updates.state === PASSED) {
      incrementFrameIndex()
    } else if (updates.state === FAILED) {
      test.state = FAILED
      testGroup.state = FAILED
      data.state = FAILED
      stopTesting()
    }
  }

  updateStore({
    state,
    testGroupIndex,
    testIndex,
    frameIndex,
    data
  })

  chrome.runtime.sendMessage({ command: `updateFrame`, updates })
}

/**
 * Keep track of timeouts.
 */
const timeouts = {
  simulateEvent: -1,
  compareHtml: -1
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
 * Keep track of event listeners.
 */
const eventListeners = {}

/**
 * Sets the event listeners for the provided `eventTypes`.
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
        addFrame({ eventType, targetSelector })
      }
    }
  }

  document.addEventListener(eventType, eventListeners[eventType], true)
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
      addFrame({
        eventType,
        targetSelector,
        value,
        id,
        name,
        placeholder
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
      addFrame({
        eventType,
        targetSelector,
        value,
        id,
        name,
        placeholder
      })
    }
  }
}

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
  const { testGroupIndex, testIndex } = store
  const { testGroups } = store.data
  const { snapshotSelector } = testGroups[testGroupIndex].tests[testIndex]
  const snapshotContainer = document.querySelector(snapshotSelector)
  const targetSelector = []

  while (element.parentNode !== null) {
    targetSelector.unshift(getSimplestElementSelector(element))

    element = element.parentNode

    if (snapshotContainer && element === snapshotContainer) {
      targetSelector.unshift(snapshotSelector)
      break
    }
  }

  return targetSelector.join(` > `)
}

/**
 * Simulates an event based on the `frame`.
 * @param {object} frame
 * @returns {boolean} `true` if the event was successfully simulated
 */
const simulateEvent = frame => {
  const { eventType, targetSelector } = frame
  const element = specialEventSimulator[eventType]
    ? specialEventSimulator[eventType](frame)
    : document.querySelector(targetSelector)

  if (!element) {
    console.warn(`TestFront could not find element:`, { eventType, targetSelector })
    return false
  }

  if (typeof element[eventType] === `function`) {  // TODO should we actually do it this way?
    console.log(`simulatedEvent by element.${eventType}() for`, { frame })
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
 * Observe document mutations.
 */
let documentHasMutated = true
const documentObserver = new MutationObserver(() => documentHasMutated = true)
documentObserver.observe(document.documentElement,  { attributes: true, childList: true, subtree: true })

/**
 * Keep track of the current `html`.
 */
let currentHtml = ``

/**
 * Pushes the current `html` as a `frame` to devtools, if changed.
 */
const record = () => {
  if (!documentHasMutated) {
    return
  }
  documentHasMutated = false

  const { testGroupIndex, testIndex } = store
  const { testGroups } = store.data
  const { snapshotSelector } = testGroups[testGroupIndex].tests[testIndex]
  const snapshotContainer = document.querySelector(snapshotSelector)

  if (!snapshotContainer) {
    return
  }

  const html = snapshotContainer.innerHTML

  if (html !== currentHtml) {
    currentHtml = html
    addFrame({ html })
  }
}

/**
 * Tests the recorded `frames`.
 */
const test = () => {
  const { testGroupIndex, testIndex, frameIndex } = store
  const { testGroups, timeLimits } = store.data
  const { frames, snapshotSelector } = testGroups[testGroupIndex].tests[testIndex]
  const frame = frames[frameIndex]
  let snapshotContainer = null

  if (typeof frame.html !== `undefined`) {
    snapshotContainer = document.querySelector(snapshotSelector)
    currentHtml = snapshotContainer && snapshotContainer.innerHTML

    if (snapshotContainer && currentHtml === frame.html) {
      clearTimeouts([`compareHtml`])
      updateFrame({ state: PASSED })
    } else if (timeouts.compareHtml < 0) {
      timeouts.compareHtml = setTimeout(() => {
        timeouts.compareHtml = -1
        updateFrame({ state: FAILED, error: snapshotContainer ? { html: currentHtml } : { message: `Snapshot container not found` } })
      }, timeLimits.compareHtml)
    }
  } else {
    if (simulateEvent(frame)) {
      clearTimeouts([`simulateEvent`])
      updateFrame({ state: PASSED })
    } else if (timeouts.simulateEvent < 0) {
      timeouts.simulateEvent = setTimeout(() => {
        timeouts.simulateEvent = -1
        updateFrame({ state: FAILED, error: { message: `Target not found` } })
      }, timeLimits.simulateEvent)
    }
  }
}

/**
 * Main loop for handling current state and relaying to devtools.
 */
const main = () => {
  if (store.state === RECORDING) {
    record()
  } else if (store.state === TESTING) {
    test()
  }

  window.requestAnimationFrame(main)
}
window.requestAnimationFrame(main)

/**
 * Handle messages from devtools.
 */
// eslint-disable-next-line no-unused-vars
const handleDevToolsMessage = (message) => {
  switch (message.command) {
    case `updateStore`:
      console.log(message.updates)
      return updateStore(message.updates)

    case `consoleLog`:
      return console.log(`handleDevToolsMessage:`, message)

    default:
      return console.warn(`Unrecognized command:`, message)
  }
}

/**
 * Get initial store state from dev tools.
 */
chrome.runtime.sendMessage({ command: `initializeContentStore` })
