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
      snapshotHtml: 10000,
      simulateEvent: 10000
    },

    delays: {
      events: {
        input: 0,
        change: 0
      }
    }
  }
}

/**
 * Updates the store by extending it. Also extends `store.data` if `updates.data` is provided.
 *
 * If `store.state` is changed to RECORDING, adds the initial snapshot and sets the event listeners for the current test.
 * If `store.state` is changed from RECORDING to something else, unsets the event listeners.
 * If `store.state` is changed to TESTING, compares the first frame's html to the current snapshot html.
 */
const updateStore = updates => {
  const startRecording = store.state !== RECORDING && updates.state === RECORDING
  const stopRecording = store.state === RECORDING && updates.state && updates.state !== RECORDING
  const startTesting = store.state !== TESTING && updates.state === TESTING

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
    addCurrentSnapshotHtml()
    setCurrentTestEventListeners()
  } else if (stopRecording) {
    setEventListeners([])
  } else if (startTesting) {
    compareCurrentSnapshotHtml()
    simulateCurrentFrameEvent()
  }
}

/**
 * When recording, adds the snapshot html to the current test.
 */
const addCurrentSnapshotHtml = () => {
  if (store.state !== RECORDING) {
    return
  }

  const { testGroupIndex, testIndex } = store
  const { testGroups } = store.data
  const testGroup = testGroups[testGroupIndex]
  const tests = testGroup && testGroup.tests
  const test = tests && tests[testIndex]
  const snapshotSelector = test && test.snapshotSelector

  if (!snapshotSelector) {
    return
  }

  const snapshotContainer = document.querySelector(snapshotSelector)
  const html = snapshotContainer && snapshotContainer.innerHTML

  if (typeof html === `string`) {
    addFrame({ html })
  }
}

/**
 * Adds the `frame` to the current test and sends the same `frame` to dev tools.
 * @param {object} frame
 */
const addFrame = frame => {
  if (store.state !== RECORDING) {
    return
  }

  const { testGroupIndex, testIndex } = store
  const data = {}
  const testGroups = [ ...store.data.testGroups ]
  const testGroup = { ...testGroups[testGroupIndex] }
  const tests = [ ...testGroup.tests ]
  const test = { ...tests[testIndex] }
  const frames = [ ...test.frames ]

  frames.push(frame)
  test.frames = frames
  test.state = UNTESTED
  tests[testIndex] = test
  testGroup.state = UNTESTED
  testGroup.tests = tests
  testGroups[testGroupIndex] = testGroup
  data.state = UNTESTED
  data.testGroups = testGroups

  updateStore({ data })

  chrome.runtime.sendMessage({ command: `addFrame`, frame })
}

/**
 * Keep track of event listeners.
 */
const eventListeners = {}

/**
 * When recording, sets the event listeners for the current test.
 */
const setCurrentTestEventListeners = () => {
  if (store.state !== RECORDING) {
    return
  }

  const { testGroupIndex, testIndex } = store
  const { testGroups } = store.data
  const testGroup = testGroups[testGroupIndex]
  const tests = testGroup && testGroup.tests
  const test = tests && tests[testIndex]
  const eventTypes = test && test.eventTypes

  if (eventTypes) {
    setEventListeners(eventTypes)
  }
}

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
 * Gets the path to some element as a selector.
 * @param {element} element
 * @returns {string}
 */
const getTargetSelector = (element) => {
  const { testGroupIndex, testIndex } = store
  const { testGroups } = store.data
  const testGroup = testGroups[testGroupIndex]
  const tests = testGroup && testGroup.tests
  const test = tests && tests[testIndex]
  const snapshotSelector = test && test.snapshotSelector

  if (!snapshotSelector) {
    return
  }

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
 * When testing, keep track of timeouts.
 */
const timeouts = {
  snapshotHtml: -1,
  simulateEvent: -1
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
 * Observe document mutations and either record or test (compare) the current snapshot html.
 */
const documentObserver = new MutationObserver(() => {
  addCurrentSnapshotHtml()
  compareCurrentSnapshotHtml()
})

documentObserver.observe(document.documentElement, {
  attributes: true,
  childList: true,
  subtree: true
})

/**
 * When testing, compares the current snapshot html to the current frame's html.
 */
const compareCurrentSnapshotHtml = () => {
  if (store.state !== TESTING) {
    return
  }

  const { testGroupIndex, testIndex, frameIndex } = store
  const { testGroups } = store.data
  const testGroup = testGroups[testGroupIndex]
  const tests = testGroup && testGroup.tests
  const test = tests && tests[testIndex]

  if (!test) {
    return
  }

  const { snapshotSelector, frames } = test
  const frame = frames && frames[frameIndex]

  if (!snapshotSelector || !frame || typeof frame.html === `undefined`) {
    return
  }

  const snapshotContainer = document.querySelector(snapshotSelector)
  const html = snapshotContainer && snapshotContainer.innerHTML

  if (html === frame.html) {
    clearTimeouts([`snapshotHtml`])
    handleFrameTestResult({ state: PASSED })
  } else if (timeouts.snapshotHtml < 0) {
    timeouts.snapshotHtml = setTimeout(() => {
      const snapshotContainer = document.querySelector(snapshotSelector)
      const html = snapshotContainer && snapshotContainer.innerHTML

      timeouts.snapshotHtml = -1
      handleFrameTestResult({ state: FAILED, error: { html } })
    }, store.data.timeLimits.snapshotHtml)
  }
}

/**
 * When testing, attempts to simulates the current frame event and updates the store based on the result.
 */
const simulateCurrentFrameEvent = () => {
  if (store.state !== TESTING) {
    return
  }

  const { testGroupIndex, testIndex, frameIndex } = store
  const { testGroups, timeLimits } = store.data
  const testGroup = testGroups[testGroupIndex]
  const tests = testGroup && testGroup.tests
  const test = tests && tests[testIndex]
  const frames = test && test.frames
  const frame = frames && frames[frameIndex]

  if (!frame || !frame.eventType) {
    return
  }

  if (simulateEvent(frame)) {
    clearTimeouts([`simulateEvent`])
    handleFrameTestResult({ state: PASSED })
  } else if (timeouts.simulateEvent < 0) {
    timeouts.simulateEvent = setTimeout(() => {
      timeouts.simulateEvent = -1
      handleFrameTestResult({ state: FAILED, error: { message: `Target not found.` } })
    }, timeLimits.simulateEvent)
  }
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
    return false
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
const specialEventTimeouts = {}
const specialEventSimulator = {
  input: ({ targetSelector, value }) => {
    const element = document.querySelector(targetSelector)

    if (element && !specialEventTimeouts.input) {
      // TODO is there a better way?
      if (element.value === value && element.getAttribute(`value`) === value) {
        return element
      }

      specialEventTimeouts.input = setTimeout(() => {
        window.requestAnimationFrame(() => {
          element.value = value
          element.setAttribute(`value`, value)

          specialEventTimeouts.input = setTimeout(() => {
            window.requestAnimationFrame(() => {
              delete specialEventTimeouts.input
            })
          }, 1)
        })
      }, store.data.delays.events.input || 0)
    }
  },

  change: ({ targetSelector, value }) => {
    const element = document.querySelector(targetSelector)

    if (element && !specialEventTimeouts.change) {
      // TODO is there a better way?
      if (element.value === value && element.getAttribute(`value`) === value) {
        return element
      }

      specialEventTimeouts.change = setTimeout(() => {
        window.requestAnimationFrame(() => {
          element.value = value
          element.setAttribute(`value`, value)

          specialEventTimeouts.change = setTimeout(() => {
            window.requestAnimationFrame(() => {
              delete specialEventTimeouts.change
            })
          }, 1)
        })
      }, store.data.delays.events.change || 0)
    }
  }
}

/**
 * Loop for comparing html and simulating events when testing.
 */
const main = () => {
  compareCurrentSnapshotHtml()
  simulateCurrentFrameEvent()
  sendFrameTestResults()
  window.requestAnimationFrame(main)
}
window.requestAnimationFrame(main)

/**
 * Buffer the sending of frame test results.
 */
let bufferedFrameTestResultsCount = 0
const bufferedFrameTestResultsLimit = 20 // Send every 20 animation frames.
const sendFrameTestResults = () => {
  if (store.bufferedFrameTestResults) {
    if (bufferedFrameTestResultsCount < bufferedFrameTestResultsLimit) {
      bufferedFrameTestResultsCount++
    } else {
      chrome.runtime.sendMessage({ command: `handleBufferedFrameTestResults`, bufferedFrameTestResults: store.bufferedFrameTestResults })
      store.bufferedFrameTestResults = null
      bufferedFrameTestResultsCount = 0
    }
  }
}

/**
 * When testing, updates the current frame and sends the necessary updates to dev tools.
 * If `updates.state` is PASSED, increments the indexes to the next testable frame.
 * If `updates.state` is FAILED, stops testing.
 * Updates the `state` of the frame's parent `test` and `testGroup` as necessary.
 * @param {object} updates
 */
const handleFrameTestResult = updates => {
  if (store.state !== TESTING) {
    return
  }

  let { state, testGroupIndex, testIndex, frameIndex } = store
  const { allTestGroups, allTests } = store

  const data = {}
  const testGroups = [ ...store.data.testGroups ]
  const testGroup = testGroups[testGroupIndex] && { ...testGroups[testGroupIndex] }
  const tests = testGroup && [ ...testGroup.tests ]
  const test = tests && tests[testIndex] && { ...tests[testIndex] }
  const frames = test && [ ...test.frames ]
  const frame = frames && frames[frameIndex] && { ...frames[frameIndex], ...updates }

  if (!frame) {
    return
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

  if (!store.bufferedFrameTestResults) {
    store.bufferedFrameTestResults = {
      data: {
        testGroups: {}
      }
    }
  }

  if (!store.bufferedFrameTestResults.data.testGroups[testGroupIndex]) {
    store.bufferedFrameTestResults.data.testGroups[testGroupIndex] = {
      tests: {}
    }
  }

  if (!store.bufferedFrameTestResults.data.testGroups[testGroupIndex].tests[testIndex]) {
    store.bufferedFrameTestResults.data.testGroups[testGroupIndex].tests[testIndex] = {
      frames: {}
    }
  }

  store.bufferedFrameTestResults.data.testGroups[testGroupIndex].tests[testIndex].frames[frameIndex] = {
    ...store.bufferedFrameTestResults.data.testGroups[testGroupIndex].tests[testIndex].frames[frameIndex],
    ...updates
  }

  if (updates.state === PASSED) {
    frameIndex++

    if (!frames[frameIndex]) {
      test.state = PASSED
      store.bufferedFrameTestResults.data.testGroups[testGroupIndex].tests[testIndex].state = PASSED

      if (tests.every(test => test.state === PASSED)) {
        testGroup.state = PASSED
        store.bufferedFrameTestResults.data.testGroups[testGroupIndex].state = PASSED
      }

      if (testGroups.every(testGroup => testGroup.state === PASSED)) {
        data.state = PASSED
        store.bufferedFrameTestResults.data.state = PASSED
      }

      if (allTests) {
        frameIndex = 0
        incrementTestIndex()
      } else {
        stopTesting()
      }
    }
  } else if (updates.state === FAILED) {
    test.state = FAILED
    store.bufferedFrameTestResults.data.testGroups[testGroupIndex].tests[testIndex].state = FAILED
    testGroup.state = FAILED
    store.bufferedFrameTestResults.data.testGroups[testGroupIndex].state = FAILED
    data.state = FAILED
    store.bufferedFrameTestResults.data.state = FAILED
    stopTesting()
  }

  store.bufferedFrameTestResults.state = state
  store.bufferedFrameTestResults.testGroupIndex = testGroupIndex
  store.bufferedFrameTestResults.testIndex = testIndex
  store.bufferedFrameTestResults.frameIndex = frameIndex

  updateStore({
    state,
    testGroupIndex,
    testIndex,
    frameIndex,
    data
  })
}

/**
 * Handle messages from devtools.
 */
// eslint-disable-next-line no-unused-vars
const handleDevToolsMessage = (message) => {
  switch (message.command) {
    case `updateStore`:
      return updateStore(message.updates)

    case `consoleLog`:
      return console.log(`handleDevToolsMessage:`, message)

    default:
      return console.warn(`Unrecognized command:`, message)
  }
}

/**
 * When recording or testing, the window might be reloaded.
 * We'll want to synchronously reload the store in this case,
 * so that we can immediately resume recording or testing.
 */
const storeKey = `__TestFront_content_script_store`

const initializeStore = () => {
  let savedStore = null

  try {
    savedStore = JSON.parse(window.localStorage.getItem(storeKey))
  } catch (error) {
  }

  if (!savedStore) {
    // Get the initial store state from dev tools.
    chrome.runtime.sendMessage({ command: `initializeContentStore` })
  } else {
    // We're in the middle of recording or testing.
    window.localStorage.removeItem(storeKey)
    updateStore(savedStore)
  }
}

initializeStore()

window.addEventListener(`unload`, () => {
  if (store.state === RECORDING || store.state === TESTING) {
    window.localStorage.setItem(storeKey, JSON.stringify(store))
  }
})
