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

  location: {
    pathname: window.location.pathname,
    hash: window.location.hash
  },

  testGroupIndex: -1,
  testIndex: -1,
  frameIndex: -1,

  allTestGroups: false,
  allTests: false,

  data: {
    state: UNTESTED,

    testGroups: [],

    timeLimits: {
      snapshot: 10000,
      event: 10000
    },

    delays: {
      events: {
        input: 0,
        change: 0
      }
    }
  },

  /* These exist only within this content script. */
  locationEventListeners: {},  // Browsers don't have a great way to confirm location changes so we have to be clever.
  bufferedFrameTestResults: null
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
    // Store not saved, so get the initial state from dev tools.
    chrome.runtime.sendMessage({
      command: `initializeContentStore`,
      updates: {
        location: store.location
      }
    })
    return
  }

  // We're in the middle of recording or testing.
  const eventType = (
    savedStore.location.pathname === window.location.pathname
    && savedStore.location.hash === window.location.hash
  ) ? `reload`
    : `navigate`

  // We've either reloaded or navigated, so go ahead and set the current location
  // to prevent the pushstate "event" in `setStoreLocation`.
  savedStore.location = {
    pathname: window.location.pathname,
    hash: window.location.hash
  }

  window.localStorage.removeItem(storeKey)
  updateStore(savedStore, eventType)
}

/**
 * Updates the store by extending it. Also extends `store.data` if `updates.data` is provided.
 * Also performs necessary side effects when starting/stopping recording/testing.
 */
const updateStore = (updates, eventType) => {
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
    addLocationFrame({ eventType })
    addCurrentSnapshotHtml()
    setCurrentTestEventListeners()
  } else if (stopRecording) {
    setEventListeners([])
  } else if (startTesting) {
    compareLocationFrame({ eventType })
    compareCurrentSnapshotHtml()
    simulateCurrentFrameEvent()
  }

  if (updates.location) {
    sendLocation()
  }
}

/**
 * When recording, adds the provided `frame` to the current test and sends the same `frame` to dev tools.
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
 * Keep track of timeouts.
 */
const timeouts = {
  snapshot: -1,
  event: -1
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
    if (locationEventTypes[eventType]) {
      delete store.locationEventListeners[eventType]
    } else if (typeof eventListeners[eventType] === `function`) {
      document.removeEventListener(eventType, eventListeners[eventType], true)
    }

    delete eventListeners[eventType]
  }
}

/**
 * Adds an event listener for the provided `eventType` and sends the `eventType` and `targetSelector` when triggered.
 * @param {string} eventType
 */
const addEventListener = eventType => {
  if (locationEventTypes[eventType]) {
    store.locationEventListeners[eventType] = true
    eventListeners[eventType] = true
    return
  }

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
 * Some events can be listened to, but need special handling.
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
    clearTimeouts([`event`])
    handleFrameTestResult({ state: PASSED })
  } else if (timeouts.event < 0) {
    timeouts.event = setTimeout(() => {
      timeouts.event = -1

      handleFrameTestResult({
        state: FAILED,
        error: !locationEventTypes[frame.eventType] ? {  // TODO find a better place to timeout the location "events"
          message: `Target not found.`
        } : {
          location: {
            pathname: window.location.pathname,
            hash: window.location.hash
          }
        }
      })
    }, timeLimits.event)
  }
}

/**
 * Some events are better simulated by calling the method attached to them.
 */
const methodEventTypes = {
  click: true
}

/**
 * Simulates an event based on the `frame`.
 * @param {object} frame
 * @returns {boolean} `true` if the event was successfully simulated
 */
const simulateEvent = frame => {
  const { eventType, targetSelector } = frame
  let element = null

  if (locationEventTypes[eventType]) {
    return  // TODO find a better place to timeout the location "events"
  } else if (specialEventSimulator[eventType]) {
    element = specialEventSimulator[eventType](frame)
  } else {
    element = document.querySelector(targetSelector)
  }

  if (!element) {
    return false
  }

  if (methodEventTypes[eventType] && typeof element[eventType] === `function`) {
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
 * Location "events" need to be recorded/confirmed manually.
 */
const locationEventTypes = {
  reload: true,
  navigate: true,
  hashchange: true,
  pushstate: true,
  popstate: true
}

/**
 * Sets `store.location` and runs `addLocationFrame` and `compareLocationFrame`, if changed.
 */
const setStoreLocation = () => {
  if (
    store.location.pathname !== window.location.pathname
    || store.location.hash !== window.location.hash
  ) {
    updateStore({
      location: {
        pathname: window.location.pathname,
        hash: window.location.hash
      }
    })

    const eventType = `pushstate`
    addLocationFrame({ eventType })
    compareLocationFrame({ eventType })
  }
}

/**
 * Send `store.location` to dev tools.
 */
const sendLocation = (location = store.location) => {
  chrome.runtime.sendMessage({
    command: `updateStore`,
    updates: {
      location
    }
  })
}

/**
 * When recording, adds a frame describing the location "event" if it meets the necessary criteria.
 */
const addLocationFrame = ({
  eventType,
  location = {
    pathname: window.location.pathname,
    hash: window.location.hash
  }
}) => {
  if (store.state !== RECORDING || !store.locationEventListeners[eventType]) {
    return
  }

  addFrame({ eventType, location })
}

/**
 * When testing, compares and confirms location updates as described by the current frame.
 */
const compareLocationFrame = ({ eventType }) => {
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

  const { frames } = test
  const frame = frames && frames[frameIndex]

  if (!frame || !frame.eventType || frame.eventType !== eventType || !locationEventTypes[eventType]) {
    return
  }

  if (confirmLocationEvent(frame)) {
    clearTimeouts([`event`]) // TODO use separate time limit for location confirmations?
    handleFrameTestResult({ state: PASSED })
  }/* else if (timeouts.event < 0) {
    timeouts.event = setTimeout(() => {
      timeouts.event = -1

      handleFrameTestResult({
        state: FAILED,
        error: {
          location: {
            pathname: window.location.pathname,
            hash: window.location.hash
          }
        }
      })
    }, store.data.timeLimits.event)
  }*/
}

/**
 * Confirm the location "event" resulted in the same location.
 */
const confirmLocationEvent = ({ eventType, location }) => {
  if (store.state !== TESTING || !locationEventTypes[eventType]) {
    return
  }

  return Boolean(
    location.pathname === window.location.pathname
    && location.hash === window.location.hash
  )
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
    clearTimeouts([`snapshot`])
    handleFrameTestResult({ state: PASSED })
  } else if (timeouts.snapshot < 0) {
    timeouts.snapshot = setTimeout(() => {
      const snapshotContainer = document.querySelector(snapshotSelector)
      const html = snapshotContainer && snapshotContainer.innerHTML

      timeouts.snapshot = -1
      handleFrameTestResult({ state: FAILED, error: { html } })
    }, store.data.timeLimits.snapshot)
  }
}

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
 * Loop for comparing snapshots and simulating events when testing.
 */
const main = () => {
  setStoreLocation()
  compareCurrentSnapshotHtml()
  simulateCurrentFrameEvent()
  sendFrameTestResults()
  window.requestAnimationFrame(main)
}
window.requestAnimationFrame(main)

/**
 * We need to manually track location events.
 */
window.addEventListener(`hashchange`, () => {
  const eventType = `hashchange`
  addLocationFrame({ eventType })
  compareLocationFrame({ eventType })
}, true)

window.addEventListener(`popstate`, () => {
  const eventType = `popstate`
  addLocationFrame({ eventType })
  compareLocationFrame({ eventType })
}, true)

/**
 * Save the store when unloading the page.
 */
window.addEventListener(`unload`, () => {
  if (store.state === RECORDING || store.state === TESTING) {
    window.localStorage.setItem(storeKey, JSON.stringify(store))
  }
}, true)

/**
 * Handle messages from devtools.
 */
// eslint-disable-next-line no-unused-vars
const handleDevToolsMessage = (message) => {
  switch (message.command) {
    case `updateStore`:
      return updateStore(message.updates)

    case `sendLocation`:
      return sendLocation()

    case `consoleLog`:
      return console.log(`handleDevToolsMessage:`, message)

    default:
      return console.warn(`Unrecognized command:`, message)
  }
}

/**
 * Initialization.
 */
initializeStore()
