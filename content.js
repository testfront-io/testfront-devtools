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
    origin: window.location.origin,
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
      test: 10000,
      saveData: 3000
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
  pendingTestGroupPath: false,
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
    savedStore.location.origin === window.location.origin
    && savedStore.location.pathname === window.location.pathname
    && savedStore.location.hash === window.location.hash
  ) ? `reload`
    : `navigate`

  // We've either reloaded or navigated, so go ahead and set the current location
  // to prevent the pushstate "event" in `setStoreLocation`.
  savedStore.location = {
    origin: window.location.origin,
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
  const stopTesting = store.state === TESTING && updates.state && updates.state !== TESTING

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
    setTestTimeouts()
    verifyTestGroupPath()
    compareLocationFrame({ eventType })
    compareCurrentSnapshotHtml()
    simulateCurrentFrameEvent()
  } else if (stopTesting) {
    clearTimeouts(`test`)
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
  test: -1
}

/**
 * Clears and sets the timeouts.
 * Uses the `store.data.timeLimits` and defaults to 10 seconds if undefined.
 * @param {object} object - timeout keys to functions
 */
const setTimeouts = object => {
  clearTimeouts(object)

  for (let key in object) {
    timeouts[key] = setTimeout(
      object[key],
      typeof store.data.timeLimits[key] !== `undefined` ? store.data.timeLimits[key] : 10000
    )
  }
}

/**
 * Clears the provided timeout `keys` and resets to -1.
 * @param {array|object|string} keys
 */
const clearTimeouts = (keys = Object.keys(timeouts)) => {
  if (typeof keys === `object` && !Array.isArray(keys)) {
    keys = Object.keys(keys)
  } else if (typeof keys === `string`) {
    keys = [ keys ]
  }

  for (let key of keys) {
    clearTimeout(timeouts[key])
    timeouts[key] = -1
  }
}

/**
 * Sets the timeouts specific to tests.
 */
const setTestTimeouts = () => setTimeouts({
  test: () => {
    const { testGroupIndex, testIndex, frameIndex } = store
    const { testGroups } = store.data
    const testGroup = testGroups[testGroupIndex]
    const tests = testGroup && testGroup.tests
    const test = tests && tests[testIndex]
    const frames = test && test.frames
    const frame = frames && frames[frameIndex]

    if (!frame) {
      return
    }

    if (typeof frame.html !== `undefined`) {
      handleFrameTestResult({
        state: FAILED,
        error: {
          filteredHtml: applySnapshotFilters(getSnapshotHtml()),
          filteredFrameHtml: applySnapshotFilters(frame.html)
        }
      })
    } else if (locationEventTypes[frame.eventType]) {
      handleFrameTestResult({
        state: FAILED,
        error: {
          location: {
            origin: window.location.origin,
            pathname: window.location.pathname,
            hash: window.location.hash
          }
        }
      })
    } else if (frame.eventType) {
      handleFrameTestResult({
        state: FAILED,
        error: {
          message: `Target not found.`
        }
      })
    }
  }
})

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
  if (store.state !== TESTING || store.pendingTestGroupPath) {
    return
  }

  const { testGroupIndex, testIndex, frameIndex } = store
  const { testGroups } = store.data
  const testGroup = testGroups[testGroupIndex]
  const tests = testGroup && testGroup.tests
  const test = tests && tests[testIndex]
  const frames = test && test.frames
  const frame = frames && frames[frameIndex]

  if (frame && frame.eventType && simulateEvent(frame)) {
    handleFrameTestResult({ state: PASSED })
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
    store.location.origin !== window.location.origin
    || store.location.pathname !== window.location.pathname
    || store.location.hash !== window.location.hash
  ) {
    updateStore({
      location: {
        origin: window.location.origin,
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
 * When testing and at the start of a test group (or test when running a single test),
 * loads or pushes the current test group's path if it doesn't already match.
 */
const verifyTestGroupPath = () => {
  if (
    store.state !== TESTING
    || store.frameIndex !== 0
    || (store.testIndex !== 0 && store.allTests)
  ) {
    return
  }

  const { testGroupIndex } = store
  const { testGroups } = store.data
  const testGroup = testGroups[testGroupIndex]

  if (!testGroup || matchTestGroupPath(testGroup)) {
    store.pendingTestGroupPath = false
    return
  } else if (store.pendingTestGroupPath) {
    // TODO figure out a better way to verify this?
    return
  }

  switch (testGroup.behavior) {
    case `load`:
      store.pendingTestGroupPath = true
      window.location.href = testGroup.path
    break

    case `push`:
      store.pendingTestGroupPath = true
      window.history.pushState({}, ``, testGroup.path)
    break

    default:
    break
  }
}

/**
 * When recording, adds a frame describing the location "event" if it meets the necessary criteria.
 */
const addLocationFrame = ({
  eventType,
  location = {
    origin: window.location.origin,
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
  if (store.state !== TESTING || store.pendingTestGroupPath) {
    return
  }

  const { testGroupIndex, testIndex, frameIndex } = store
  const { testGroups } = store.data
  const testGroup = testGroups[testGroupIndex]
  const tests = testGroup && testGroup.tests
  const test = tests && tests[testIndex]
  const frames = test && test.frames
  const frame = frames && frames[frameIndex]

  if (
    frame
    && frame.eventType
    && frame.eventType === eventType
    && locationEventTypes[eventType]
    && confirmLocationEvent(frame)
  ) {
    handleFrameTestResult({ state: PASSED })
  }
}

/**
 * Confirm the location "event" resulted in the same location.
 */
const confirmLocationEvent = ({ eventType, location }) => {
  if (store.state !== TESTING || store.pendingTestGroupPath || !locationEventTypes[eventType]) {
    return
  }

  return Boolean(
    location.origin === window.location.origin
    && location.pathname === window.location.pathname
    && location.hash === window.location.hash
  )
}

/**
 * Returns the current snapshot's html, unfiltered.
 */
const getSnapshotHtml = () => {
  const { testGroupIndex, testIndex } = store
  const { testGroups } = store.data
  const testGroup = testGroups[testGroupIndex]
  const tests = testGroup && testGroup.tests
  const test = tests && tests[testIndex]
  const snapshotSelector = test && test.snapshotSelector
  const snapshotContainer = snapshotSelector && document.querySelector(snapshotSelector)

  return snapshotContainer && snapshotContainer.innerHTML
}

/**
 * Applies the current test's filters to the provided `html`.
 */
const applySnapshotFilters = html => {
  const { testGroupIndex, testIndex } = store
  const { testGroups } = store.data
  const testGroup = testGroups[testGroupIndex]
  const tests = testGroup && testGroup.tests
  const test = tests && tests[testIndex]
  const snapshotFilters = test && test.snapshotFilters

  if (!html || !snapshotFilters || !snapshotFilters.length) {
    return html
  }

  for (let { type, values } of snapshotFilters) {
    if (filterSnapshotHtml[type]) {
      html = filterSnapshotHtml[type]({ html, values })
    }
  }

  return html
}

/**
 * Filters snapshot html based on the `type`.
 * @param {string} html
 * @param {object} values
 * @returns {string}
 */
const filterSnapshotHtml = {
  removeElements: ({ html, values }) => {
    if (!values.elementsSelector) {
      return html
    }

    const container = document.createElement(`div`)
    container.innerHTML = html
    const elements = [ ...container.querySelectorAll(values.elementsSelector) ]
    let element = null

    while (elements.length) {
      element = elements.pop()
      element.parentNode.removeChild(element)
    }

    return container.innerHTML
  },

  removeAttribute: ({ html, values }) => {
    if (!values.elementsSelector || !values.attribute) {
      return html
    }

    const container = document.createElement(`div`)
    container.innerHTML = html
    const elements = [ ...container.querySelectorAll(values.elementsSelector) ]

    for (let element of elements) {
      element.removeAttribute(values.attribute)
    }

    return container.innerHTML
  }
}

/**
 * When recording, adds the snapshot html (unfiltered) to the current test.
 */
const addCurrentSnapshotHtml = () => {
  if (store.state !== RECORDING) {
    return
  }

  const html = getSnapshotHtml()

  if (typeof html === `string`) {
    addFrame({ html })
  }
}

/**
 * When testing, compares the current snapshot html to the current frame's html.
 */
const compareCurrentSnapshotHtml = () => {
  if (store.state !== TESTING || store.pendingTestGroupPath) {
    return
  }

  const { testGroupIndex, testIndex, frameIndex } = store
  const { testGroups } = store.data
  const testGroup = testGroups[testGroupIndex]
  const tests = testGroup && testGroup.tests
  const test = tests && tests[testIndex]
  const frames = test && test.frames
  const frame = frames && frames[frameIndex]
  const snapshotSelector = test && test.snapshotSelector

  if (
    snapshotSelector
    && frame
    && typeof frame.html !== `undefined`
    && applySnapshotFilters(getSnapshotHtml()) === applySnapshotFilters(frame.html)
  ) {
    handleFrameTestResult({ state: PASSED })
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

  setTestTimeouts()
}

/**
 * `matchPath` from `react-router` and `pathtoRegexp` from `path-to-regexp`
 * // TODO tried to keep this content.js script minimal but it looks like we may have to split it up and bundle it
 */
const matchPath = (() => {
  /**
   * Match matching groups in a regular expression.
   */
  var MATCHING_GROUP_REGEXP = /\((?!\?)/g;

  /**
   * Normalize the given path string,
   * returning a regular expression.
   *
   * An empty array should be passed,
   * which will contain the placeholder
   * key names. For example "/user/:id" will
   * then contain ["id"].
   *
   * @param  {String|RegExp|Array} path
   * @param  {Array} keys
   * @param  {Object} options
   * @return {RegExp}
   * @api private
   */

  function pathToRegexp(path, keys, options) {
    options = options || {};
    keys = keys || [];
    var strict = options.strict;
    var end = options.end !== false;
    var flags = options.sensitive ? '' : 'i';
    var extraOffset = 0;
    var keysOffset = keys.length;
    var i = 0;
    var name = 0;
    var m;

    if (path instanceof RegExp) {
      // eslint-disable-next-line no-cond-assign
      while (m = MATCHING_GROUP_REGEXP.exec(path.source)) {
        keys.push({
          name: name++,
          optional: false,
          offset: m.index
        });
      }

      return path;
    }

    if (Array.isArray(path)) {
      // Map array parts into regexps and return their source. We also pass
      // the same keys and options instance into every generation to get
      // consistent matching groups before we join the sources together.
      path = path.map(function (value) {
        return pathToRegexp(value, keys, options).source;
      });

      return new RegExp('(?:' + path.join('|') + ')', flags);
    }

    path = ('^' + path + (strict ? '' : path[path.length - 1] === '/' ? '?' : '/?'))
      .replace(/\/\(/g, '/(?:')
      // eslint-disable-next-line no-useless-escape
      .replace(/([\/\.])/g, '\\$1')
      .replace(/(\\\/)?(\\\.)?:(\w+)(\(.*?\))?(\*)?(\?)?/g, function (match, slash, format, key, capture, star, optional, offset) {
        slash = slash || '';
        format = format || '';
        capture = capture || '([^\\/' + format + ']+?)';
        optional = optional || '';

        keys.push({
          name: key,
          optional: !!optional,
          offset: offset + extraOffset
        });

        var result = ''
          + (optional ? '' : slash)
          + '(?:'
          + format + (optional ? slash : '') + capture
          + (star ? '((?:[\\/' + format + '].+?)?)' : '')
          + ')'
          + optional;

        extraOffset += result.length - match.length;

        return result;
      })
      .replace(/\*/g, function (star, index) {
        var len = keys.length

        while (len-- > keysOffset && keys[len].offset > index) {
          keys[len].offset += 3; // Replacement length minus asterisk length.
        }

        return '(.*)';
      });

    // This is a workaround for handling unnamed matching groups.
    // eslint-disable-next-line no-cond-assign
    while (m = MATCHING_GROUP_REGEXP.exec(path)) {
      var escapeCount = 0;
      var index = m.index;

      while (path.charAt(--index) === '\\') {
        escapeCount++;
      }

      // It's possible to escape the bracket.
      if (escapeCount % 2 === 1) {
        continue;
      }

      if (keysOffset + i === keys.length || keys[keysOffset + i].offset > m.index) {
        keys.splice(keysOffset + i, 0, {
          name: name++, // Unnamed matching groups must be consistently linear.
          optional: false,
          offset: m.index
        });
      }

      i++;
    }

    // If the path is non-ending, match until the end or a slash.
    path += (end ? '$' : (path[path.length - 1] === '/' ? '' : '(?=\\/|$)'));

    return new RegExp(path, flags);
  };

  const cache = {};
  const cacheLimit = 10000;
  let cacheCount = 0;

  function compilePath(path, options) {
    const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
    const pathCache = cache[cacheKey] || (cache[cacheKey] = {});

    if (pathCache[path]) return pathCache[path];

    const keys = [];
    const regexp = pathToRegexp(path, keys, options);
    const result = { regexp, keys };

    if (cacheCount < cacheLimit) {
      pathCache[path] = result;
      cacheCount++;
    }

    return result;
  }

  /**
   * Public API for matching a URL pathname to a path.
   */
  return function (pathname, options = {}) {
    if (typeof options === "string" || Array.isArray(options)) {
      options = { path: options };
    }

    const { path, exact = false, strict = false, sensitive = false } = options;

    const paths = [].concat(path);

    return paths.reduce((matched, path) => {
      if (!path && path !== "") return null;
      if (matched) return matched;

      const { regexp, keys } = compilePath(path, {
        end: exact,
        strict,
        sensitive
      });
      const match = regexp.exec(pathname);

      if (!match) return null;

      const [url, ...values] = match;
      const isExact = pathname === url;

      if (exact && !isExact) return null;

      return {
        path, // the path used to match
        url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
        isExact, // whether or not we matched exactly
        params: keys.reduce((memo, key, index) => {
          memo[key.name] = values[index];
          return memo;
        }, {})
      };
    }, null);
  }
})()

/**
 * Uses `matchPath` from `react-router` to match the current `store.location` to the `testGroup.path`.
 * @param {object} testGroup
 */
const matchTestGroupPath = testGroup => {
  const { location } = store
  const pathname = (location && location.pathname) || ``
  const hash = (location && location.hash) || ``
  const { path, exact, strict } = testGroup

  return matchPath(pathname + hash, { path, exact, strict })
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
  verifyTestGroupPath()
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
