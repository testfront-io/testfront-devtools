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

  UNTESTED
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
 * Updates multiple frames, tests, testGroups, data, and store.
 * @param {object} store
 * @param {object} message
 */
const handleBufferedFrameTestResults = ({ store, message }) => {
  const { bufferedFrameTestResults } = message
  const { data: bufferedData, ...bufferedUpdates } = bufferedFrameTestResults
  const { testGroups: bufferedTestGroups, ...bufferedDataUpdates } = bufferedData

  store.updateStore(store => {
    if (store.state !== TESTING) {
      return
    }

    const testGroups = [ ...store.data.testGroups ]

    const updates = {
      ...bufferedUpdates,
      data: {
        ...bufferedDataUpdates,
        testGroups
      }
    }

    for (let testGroupIndex in bufferedTestGroups) {
      const { tests, ...testGroupUpdates } = bufferedTestGroups[testGroupIndex]

      testGroups[testGroupIndex] = {
        ...testGroups[testGroupIndex],
        ...testGroupUpdates
      }

      for (let testIndex in tests) {
        const { frames, ...testUpdates } = bufferedTestGroups[testGroupIndex].tests[testIndex]

        testGroups[testGroupIndex].tests[testIndex] = {
          ...testGroups[testGroupIndex].tests[testIndex],
          ...testUpdates
        }

        for (let frameIndex in frames) {
          testGroups[testGroupIndex].tests[testIndex].frames[frameIndex] = {
            ...testGroups[testGroupIndex].tests[testIndex].frames[frameIndex],
            ...frames[frameIndex]
          }
        }
      }
    }

    return updates
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
 * Updates the content script's store when ready.
 * Uses optional `message.updates` from content script.
 * @param {object} store
 * @param {object} message
 */
const initializeContentStore = ({ store, message }) => store.updateStore(store => ({
  ...(message.updates || {}),
  shouldUpdateContentStore: true
}))

/**
 * Updates the store using `message.updates`.
 * @param {object} store
 * @param {object} message
 */
const updateStore = ({ store, message }) => {
  store.updateStore(store => message.updates)
}

/**
 * The tab needs a reference to the current `store` within its `onMessage` handlers.
 */
const getTabRef = (store) => {
  const tabRef = { store }

  tab.onMessage((message) => {
    switch (message.command) {
      case `initializeContentStore`:
        initializeContentStore({ store: tabRef.store, message })
        break

      case `updateStore`:
        updateStore({ store: tabRef.store, message })
        break

      case `addFrame`:
        addFrame({ store: tabRef.store, message })
        break

      case `handleBufferedFrameTestResults`:
        handleBufferedFrameTestResults({ store: tabRef.store, message })
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
  const [ timeouts ] = React.useState({})
  const [ store, setStore ] = React.useState({
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

    location: null,

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
        behavior: `load`,
        tests: [{
          state: UNTESTED,
          description: ``,
          snapshotSelector: ``,
          eventTypes: [],
          frames: [typeof frame.html !== `undefined` ? {
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

        tab.sendMessage({ command: `sendLocation` })
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

      tab.sendMessage({
        command: `updateStore`,
        updates: getStoreForContentScript(store)
      })

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

        if (allTestGroups && testGroup.skip) {
          continue
        }

        const tests = [ ...testGroup.tests ]
        let testsChanged = false

        for (let test = null; testIndex < tests.length; testIndex++) {
          test = { ...tests[testIndex] }

          if (allTests && test.skip) {
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
            path: (store.location && (store.location.pathname || `` + store.location.hash || ``)) || `/`,
            exact: false,
            strict: false,
            skip: false,
            behavior: `load`,
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

    addTest: ({ testGroupIndex, test = {} }) => store.updateStore(store => {
      const lastTest = store.data.testGroups[testGroupIndex].tests[store.data.testGroups[testGroupIndex].tests.length - 1]

      return {
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
                  snapshotSelector: (lastTest && lastTest.snapshotSelector) || `html`,
                  eventTypes: (lastTest && lastTest.eventTypes) || [
                    `reload`,
                    `navigate`,
                    `pushstate`,
                    `click`,
                    `input`,
                    `change`,
                    `submit`
                  ],
                  frames: [],
                  skip: false,
                  ...test
                }
              ]
            },
            ...store.data.testGroups.slice(testGroupIndex + 1)
          ]
        }
      }
    }),

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
    } else if (store.status === ``) {
      if (!store.isInitialized) {
        store.fetchData()
        return
      }

      if (store.shouldUpdateContentStore) {
        store.updateContentStore()
      }

      if (store.shouldSaveData) {
        clearTimeout(timeouts.saveData)
        timeouts.saveData = setTimeout(() => store.saveData())
      }
    }
  }, [ store, timeouts ])

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
