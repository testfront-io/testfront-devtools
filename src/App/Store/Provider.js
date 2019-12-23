/* global chrome */
import React from 'react'
import * as API from '../../API'
import Context from './Context'
import * as UI from '../../UI'
import tab from '../../tab'

import {
  IDLE,
  RECORDING,
  TESTING,

  UNTESTED,
  PASSED,
  FAILED
} from '../../constants'

/**
 * Promisified versions of `chrome.storage.local.get` and `set`.
 */
const local = {
  get: (...args) => new Promise(resolve => {
    args.push((result) => resolve(typeof args[0] === `object` ? result : result[args[0]]))
    chrome.storage.local.get(...args)
  }),

  set: (...args) => new Promise(resolve => {
    args.push(() => resolve())
    chrome.storage.local.set(...args)
  })
}

/**
 * Adds the `message.frame` to the current test.
 * @param {object} store
 * @param {object} message
 */
const addFrame = ({ store, message }) => {
  const { frame } = message

  store.updateStore(store => {
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
    test.state = UNTESTED
    tests[testIndex] = test
    testGroup.state = UNTESTED
    testGroup.tests = tests
    testGroups[testGroupIndex] = testGroup
    data.state = UNTESTED
    data.testGroups = testGroups

    return { data }
  })
}

/**
 * Updates the current frame.
 * If `store.state` is TESTING:
 *   If `updates.state` is PASSED, increments the indexes to the next testable frame.
 *   If `updates.state` is FAILED, stops testing.
 *   Updates the frame's parent `test` and `testGroup` as necessary.
 * @param {object} store
 * @param {object} message
 */
const updateFrame = ({ store, message }) => {
  const { updates } = message

  store.updateStore(store => {
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

    frames[frameIndex] = frame
    test.frames = frames
    tests[testIndex] = test
    testGroup.tests = tests
    testGroups[testGroupIndex] = testGroup
    data.testGroups = testGroups

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

    return {
      state,
      testGroupIndex,
      testIndex,
      frameIndex,
      data
    }
  })
}

/**
 * Gets the store as relevant to the content script.
 * @param {object} store
 */
const getStoreForContentScript = store => ({
  state: store.state,

  testGroupIndex: store.testGroupIndex,
  testIndex: store.testIndex,
  frameIndex: store.frameIndex,

  allTestGroups: store.allTestGroups,
  allTests: store.allTests,

  data: store.data
})

/**
 * Updates the content script's store.
 * @param {object} store
 */
const updateContentStore = store => {
  store = getStoreForContentScript(store)
  tab.sendMessage({ command: `updateStore`, updates: store })
}

/**
 * The tab needs a reference to the current `store` within its `onMessage` handlers.
 */
const getTabRef = (store) => {
  const tabRef = { store }

  tab.onMessage((message) => {
    switch (message.command) {
      case `initializeContentStore`:
        updateContentStore(tabRef.store)
        break

      case `addFrame`:
        addFrame({ store: tabRef.store, message })
        break

      case `updateFrame`:
        updateFrame({ store: tabRef.store, message })
        break

      case `consoleLog`:
        return console.log(message)

      default:
        return console.warn(`Unrecognized command:`, message)
    }
  })

  return tabRef
}

/**
 * Simple key-value store. Uses `chrome.storage.local` by default.
 * Use `store.updateStore(store => ({ source: 'server' }))` to use with `testfront-extension-server`.
 */
const Provider = ({ children }) => {
  const [ store, setStore ] = React.useState({
    timeouts: {},
    tabRef: null,
    isConfigured: false,
    isInitialized: false,
    shouldSaveData: false,
    shouldUpdateContentStore: false,

    source: `local`,
    serverBaseURL: API.client.defaults.baseURL,
    status: ``,
    error: ``,

    state: IDLE,

    testGroupIndex: -1,
    testIndex: -1,
    frameIndex: -1,

    allTestGroups: false,
    allTests: false,

    data: {
      state: UNTESTED,

      testGroups: [/*{
        state: UNTESTED,
        description: ``,
        path: `/`, // Matched via react-router's `matchPath` function.
        exact: false,
        strict: false,
        skip: false,
        tests: [{
          state: UNTESTED,
          description: ``,
          snapshotSelector: ``,
          eventTypes: [],
          frames: [frame.html ? {
            state: UNTESTED,
            html,
            error?: {
              html
            }
          } : {
            state: UNTESTED,
            eventType,
            targetSelector,
            value?,
            id?,
            name?,
            placeholder?,
            error?: {
              message: ``
            }
          }]
        }]
      }*/],

      timeLimits: {
        simulateEvent: 2000,
        compareHtml: 2000
      }
    },

    configure: async () => {
      const { source, serverBaseURL } = await local.get([`source`, `serverBaseURL`])

      setStore(store => ({
        ...store,
        tabRef: getTabRef(store),
        isConfigured: true,
        source: source || store.source,
        serverBaseURL: serverBaseURL || store.serverBaseURL
      }))
    },

    fetchData: () => setStore(store => {
      const storeFetchingStatus = {
        ...store,
        status: `fetching`,
        error: ``
      }

      const fetch = async () => {
        const updates = {
          isInitialized: true,
          status: ``,
          error: ``
        }

        if (store.source === `server`) {
          try {
            updates.data = (await API.client.get(`data`)).data || store.data
          } catch (error) {
            updates.error = API.utilities.getErrorMessage(error) || `unknown`
          }
        } else {
          try {
            updates.data = (await local.get(`data`)) || store.data
          } catch (error) {
            updates.error = String(error) || `unknown`
          }
        }

        setStore(store => ({
          ...store,
          ...updates,
          shouldUpdateContentStore: true
        }))
      }

      fetch()

      return storeFetchingStatus
    }),

    saveData: () => setStore(store => {
      const storeSavingStatus = {
        ...store,
        status: `saving`,
        error: ``
      }

      const save = async () => {
        const updates = {
          shouldSaveData: false,
          status: ``,
          error: ``
        }

        if (store.source === `server`) {
          try {
            await API.client.put(`data`, store.data)
          } catch (error) {
            updates.error = API.utilities.getErrorMessage(error) || `unknown`
          }
        } else {
          try {
            console.log({ data: store.data })
            await local.set({ data: store.data })
          } catch (error) {
            updates.error = String(error) || `unknown`
          }
        }

        setStore(store => ({
          ...store,
          ...updates,
        }))
      }

      save()

      return storeSavingStatus
    }),

    updateStore: getUpdates => setStore(store => {
      const updates = getUpdates(store)

      if (!updates) {
        return store
      }

      if (updates.source && updates.source !== store.source) {
        local.set({ source: updates.source })
        updates.isInitialized = false
        updates.shouldSaveData = true
        updates.status = ``
        updates.error ``
      }

      if (updates.serverBaseURL && updates.serverBaseURL !== store.serverBaseURL) {
        local.set({ serverBaseURL: updates.serverBaseURL })
        API.client.defaults.baseURL = store.serverBaseURL
        updates.isInitialized = false
        updates.shouldSaveData = true
        updates.status = ``
        updates.error ``
      }

      if (updates.data) {
        updates.shouldSaveData = true

        updates.data = {
          ...store.data,
          ...updates.data
        }
      }

      return {
        ...store,
        ...updates
      }
    }),

    updateContentStore: () => setStore(store => {
      store = {
        ...store,
        shouldUpdateContentStore: false
      }

      updateContentStore(store)

      return store
    }),

    startRecording: ({ testGroupIndex, testIndex, frameIndex = -1 }) => store.updateStore(store => {
      const updates = {
        shouldUpdateContentStore: true,
        state: RECORDING,
        testGroupIndex,
        testIndex,
        frameIndex
      }

      return updates
    }),

    stopRecording: () => store.updateStore(store => {
      const updates = {
        shouldUpdateContentStore: true,
        state: IDLE,
        testGroupIndex: -1,
        testIndex: -1,
        frameIndex: -1
      }

      return updates
    }),

    startTesting: ({ testGroupIndex = 0, testIndex = 0, frameIndex = 0, allTestGroups = false, allTests = false }) => store.updateStore(store => {
      const testGroups = [ ...store.data.testGroups ]
      let testGroupsChanged = false

      const updates = {
        shouldUpdateContentStore: true,
        state: TESTING,

        testGroupIndex,
        testIndex,
        frameIndex,

        allTestGroups,
        allTests,

        data: {
          state: UNTESTED,
          testGroups
        }
      }

      for (let testGroup = null; testGroupIndex < testGroups.length; testGroupIndex++) {
        testGroup = { ...testGroups[testGroupIndex] }

        if (testGroup.skip && testGroupIndex !== updates.testGroupIndex) {
          continue
        }

        const tests = [ ...testGroup.tests ]
        let testsChanged = false

        for (let test = null; testIndex < tests.length; testIndex++) {
          test = { ...tests[testIndex] }

          if (test.skip && (testGroupIndex !== updates.testGroupIndex || (allTests && testIndex !== updates.testIndex))) {
            continue
          }

          const frames = [ ...test.frames ]
          let framesChanged = false

          for (let frame = null; frameIndex < frames.length; frameIndex++) {
            frame = { ...frames[frameIndex] }
            frame.state = UNTESTED
            frame.error = undefined
            frames[frameIndex] = frame
            framesChanged = true
          }

          if (framesChanged) {
            test.frames = frames
            test.state = UNTESTED
            tests[testIndex] = test
            testsChanged = true
          }

          if (allTests) {
            frameIndex = 0
          } else {
            break
          }
        }

        if (testsChanged) {
          testGroup.tests = tests
          testGroup.state = UNTESTED
          testGroups[testGroupIndex] = testGroup
          testGroupsChanged = true
        }

        if (allTestGroups) {
          testIndex = 0
        } else {
          break
        }
      }

      if (!testGroupsChanged) {
        return
      }

      return updates
    }),

    stopTesting: () => store.updateStore(store => {
      const updates = {
        shouldUpdateContentStore: true,
        state: IDLE,
        testGroupIndex: -1,
        testIndex: -1,
        frameIndex: -1
      }

      return updates
    }),

    addTestGroup: ({ testGroup = {} } = {}) => store.updateStore(store => ({
      data: {
        testGroups: [
          ...store.data.testGroups,
          {
            state: UNTESTED,
            path: `/`,
            exact: false,
            strict: false,
            skip: false,
            tests: [],
            ...testGroup
          }
        ]
      }
    })),

    updateTestGroup: ({ testGroupIndex, updates }) => store.updateStore(store => ({
      data: {
        testGroups: [
          ...store.data.testGroups.slice(0, testGroupIndex),
          {
            ...store.data.testGroups[testGroupIndex],
            ...updates
          },
          ...store.data.testGroups.slice(testGroupIndex + 1)
        ]
      }
    })),

    deleteTestGroup: ({ testGroupIndex }) => store.updateStore(store => ({
      data: {
        testGroups: [
          ...store.data.testGroups.slice(0, testGroupIndex),
          ...store.data.testGroups.slice(testGroupIndex + 1)
        ]
      }
    })),

    addTest: ({ testGroupIndex, test = {} }) => store.updateStore(store => ({
      data: {
        testGroups: [
          ...store.data.testGroups.slice(0, testGroupIndex),
          {
            ...store.data.testGroups[testGroupIndex],
            tests: [
              ...store.data.testGroups[testGroupIndex].tests,
              {
                state: UNTESTED,
                description: ``,
                snapshotSelector: (store.data.testGroups[testGroupIndex].tests[store.data.testGroups[testGroupIndex].tests.length - 1] && store.data.testGroups[testGroupIndex].tests[store.data.testGroups[testGroupIndex].tests.length - 1].snapshotSelector) || `html`,
                eventTypes: [ `click`, `input`, `change` ],
                frames: [],
                skip: false,
                ...test
              }
            ]
          },
          ...store.data.testGroups.slice(testGroupIndex + 1)
        ]
      }
    })),

    updateTest: ({ testGroupIndex, testIndex, updates }) => store.updateStore(store => ({
      data: {
        testGroups: [
          ...store.data.testGroups.slice(0, testGroupIndex),
          {
            ...store.data.testGroups[testGroupIndex],
            tests: [
              ...store.data.testGroups[testGroupIndex].tests.slice(0, testIndex),
              {
                ...store.data.testGroups[testGroupIndex].tests[testIndex],
                ...updates
              },
              ...store.data.testGroups[testGroupIndex].tests.slice(testIndex + 1)
            ]
          },
          ...store.data.testGroups.slice(testGroupIndex + 1)
        ]
      }
    })),

    deleteTest: ({ testGroupIndex, testIndex }) => store.updateStore(store => ({
      data: {
        testGroups: [
          ...store.data.testGroups.slice(0, testGroupIndex),
          {
            ...store.data.testGroups[testGroupIndex],
            tests: [
              ...store.data.testGroups[testGroupIndex].tests.slice(0, testIndex),
              ...store.data.testGroups[testGroupIndex].tests.slice(testIndex + 1)
            ]
          },
          ...store.data.testGroups.slice(testGroupIndex + 1)
        ]
      }
    })),

    updateFrame: ({ testGroupIndex, testIndex, frameIndex, updates }) => store.updateStore(store => ({
      data: {
        testGroups: [
          ...store.data.testGroups.slice(0, testGroupIndex),
          {
            ...store.data.testGroups[testGroupIndex],
            tests: [
              ...store.data.testGroups[testGroupIndex].tests.slice(0, testIndex),
              {
                ...store.data.testGroups[testGroupIndex].tests[testIndex],
                frames: [
                  ...store.data.testGroups[testGroupIndex].tests[testIndex].frames.slice(0, frameIndex),
                  {
                    ...store.data.testGroups[testGroupIndex].tests[testIndex].frames[frameIndex],
                    ...updates
                  },
                  ...store.data.testGroups[testGroupIndex].tests[testIndex].frames.slice(frameIndex + 1)
                ]
              },
              ...store.data.testGroups[testGroupIndex].tests.slice(testIndex + 1)
            ]
          },
          ...store.data.testGroups.slice(testGroupIndex + 1)
        ]
      }
    })),

    deleteFrame: ({ testGroupIndex, testIndex, frameIndex }) => store.updateStore(store => ({
      data: {
        testGroups: [
          ...store.data.testGroups.slice(0, testGroupIndex),
          {
            ...store.data.testGroups[testGroupIndex],
            tests: [
              ...store.data.testGroups[testGroupIndex].tests.slice(0, testIndex),
              {
                ...store.data.testGroups[testGroupIndex].tests[testIndex],
                frames: [
                  ...store.data.testGroups[testGroupIndex].tests[testIndex].frames.slice(0, frameIndex),
                  ...store.data.testGroups[testGroupIndex].tests[testIndex].frames.slice(frameIndex + 1)
                ]
              },
              ...store.data.testGroups[testGroupIndex].tests.slice(testIndex + 1)
            ]
          },
          ...store.data.testGroups.slice(testGroupIndex + 1)
        ]
      }
    }))
  })

  if (store.tabRef) {
    store.tabRef.store = store
  }

  React.useEffect(() => {
    if (!store.isConfigured) {
      store.configure()
    } else if (!store.isInitialized && store.status === ``) {
      clearTimeout(store.timeouts.fetchData)
      store.timeouts.fetchData = setTimeout(() =>  store.fetchData())
    } else if (store.shouldSaveData && store.status === ``) {
      clearTimeout(store.timeouts.saveData)
      store.timeouts.saveData = setTimeout(() =>  store.saveData())
    }

    if (store.shouldUpdateContentStore) {
      clearTimeout(store.timeouts.updateContentStore)
      store.timeouts.updateContentStore = setTimeout(() =>  store.updateContentStore())
    }
  }, [ store ])

  return store.isInitialized ? (
    <Context.Provider value={store}>
      {children}
    </Context.Provider>
  ) : (
    <UI.Modal center={true}>
      <UI.Spinner />
    </UI.Modal>
  )
}

export default Provider
