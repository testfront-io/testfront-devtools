/* global chrome */
import React from 'react'
import * as API from '../../API'
import Context from './Context'
import tab from '../../tab'

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
 * Copies an object and assigns the provided `value` to each key.
 * @param {object} object
 * @param {any} value
 */
const copyObjectWithValue = (object, value) => {
  const copy = {}

  for (let key in object) {
    copy[key] = value
  }

  return copy
}

/**
 * Adds the provided snapshot or event to the test at the current `testIndex`.
 * @param {object} store
 * @param {object} message
 */
const pushRecordedItem = ({ store, message }) => {
  const { routeIndex, testIndex } = store.recording

  store.setData(data => {
    const routes = [ ...data.routes ]

    if (!routes[routeIndex]) {
      return
    }

    const tests = [ ...routes[routeIndex].tests ]

    if (!tests[testIndex]) {
      return
    }

    tests[testIndex] = {
      ...tests[testIndex],
      recorded: [
        ...(tests[testIndex].recorded || []),
        message.recordedItem
      ]
    }

    routes[routeIndex] = { ...routes[routeIndex], tests }

    return { routes }
  })
}

/**
 * Sets `isRecording` to `false`.
 * @param {object} store
 */
const stopRecording = ({ store }) => {
  store.set(store => ({ isRecording: false }))
}

/**
 * Sets `passed` to `true` for the current test item.
 * @param {object} store
 * @param {object} message
 */
const testItemPassed = ({ store, message }) => {
  const { routeIndex, testIndex } = store.testing
  const { recordedIndex } = message

  store.setData(data => {
    const routes = [ ...data.routes ]
    const tests = [ ...(routes[routeIndex] || {}).tests ]
    const recorded = [ ...(tests[testIndex] || {}).recorded ]

    if (!recorded[recordedIndex]) {
      return
    }

    recorded[recordedIndex] = {
      ...recorded[recordedIndex],
      passed: true
    }

    tests[testIndex] = {
      ...tests[testIndex],
      recorded
    }

    routes[routeIndex] = {
      ...routes[routeIndex],
      tests
    }

    return { routes }
  })
}

/**
 * Sets `passed` to `false` and assigns the provided `message.error` to the current test item.
 * @param {object} store
 * @param {object} message
 */
const testItemFailed = ({ store, message }) => {
  const { routeIndex, testIndex } = store.testing
  const { recordedIndex, error } = message

  store.setData(data => {
    const routes = [ ...data.routes ]
    const tests = [ ...(routes[routeIndex] || {}).tests ]
    const recorded = [ ...(tests[testIndex] || {}).recorded ]

    if (!recorded[recordedIndex]) {
      return
    }

    recorded[recordedIndex] = {
      ...recorded[recordedIndex],
      passed: false,
      error
    }

    tests[testIndex] = {
      ...tests[testIndex],
      recorded
    }

    routes[routeIndex] = {
      ...routes[routeIndex],
      tests
    }

    return { routes }
  })
}

/**
 * Sets `isTesting` to `false`.
 * @param {object} store
 * @param {object} message
 */
const stopTesting = ({ store, message }) => {
  store.set(store => ({ isTesting: false }))
}

/**
 * Run when initializing the store.
 */
const initialize = (store) => {
  const ref = { store }

  tab.onMessage((message) => {
    switch (message.command) {
      case `pushRecordedItem`:
        pushRecordedItem({ store: ref.store, message })
        break

      case `stopRecording`:
        stopRecording({ store: ref.store, message })
        break

      case `testItemPassed`:
        testItemPassed({ store: ref.store, message })
        break

      case `testItemFailed`:
        testItemFailed({ store: ref.store, message })
        break

      case `stopTesting`:
        stopTesting({ store: ref.store, message })
        break

      case `consoleLog`:
        return console.log(message)

      default:
        return console.warn(`Unrecognized command:`, message)
    }
  })

  return ref
}

/**
 * Simple key-value store. Uses `chrome.storage.local` by default.
 * Use `set(store => ({ source: 'server' }))` to use with `testfront-extension-server`.
 */
const Provider = ({ children }) => {
  const [ store, setStore ] = React.useState({
    isConfigured: false,
    isInitialized: false,
    initializedRef: null,

    source: `local`,
    serverBaseURL: API.client.defaults.baseURL,

    editing: {
      routeIndex: -1,
    },

    recording: {
      routeIndex: -1,
      testIndex: -1
    },

    testing: {
      routeIndex: -1,
      testIndex: -1,
      allRoutes: false,
      allTests: false
    },

    data: {
      routes: [{
        path: `/`, // Matched via react-router's `matchPath` function.
        exact: false,
        strict: false,
        skip: false,
        tests: [/*{
          description: ``,
          snapshotSelector: ``,
          eventTypes: [],
          recorded: []
        }*/]
      }]
    },

    status: {},
    error: {},

    getData: async (key) => {
      if (typeof key === `object`) {
        return (Array.isArray(key) ? key : Object.keys(key)).forEach(key => store.getData(key))
      }

      setStore(store => ({
        ...store,
        status: { ...store.status, [key]: `fetching` }
      }))

      switch (store.source) {
        case `server`:
          try {
            const value = (await API.client.get(key)).data || store.data[key]

            setStore(store => ({
              ...store,
              data: { ...store.data, [key]: value },
              status: { ...store.status, [key]: `` },
              error: { ...store.error, [key]: `` }
            }))
          } catch (error) {
            setStore(store => ({
              ...store,
              status: { ...store.status, [key]: `` },
              error: { ...store.error, [key]: API.utilities.getErrorMessage(error) || `unknown` }
            }))
          }
          break

        default:
          try {
            const value = await local.get(key) || store.data[key]

            setStore(store => ({
              ...store,
              data: { ...store.data, [key]: value },
              status: { ...store.status, [key]: `` },
              error: { ...store.error, [key]: `` }
            }))
          } catch (error) {
            setStore(store => ({
              ...store,
              status: { ...store.status, [key]: `` },
              error: { ...store.error, [key]: String(error) || `unknown` }
            }))
          }
      }
    },

    setData: (dataFunc) => {
      setStore(store => {
        const data = dataFunc(store.data)

        if (!data) {
          return store
        }

        switch (store.source) {
          case `server`:
            Object.keys(data).forEach(async key => {
              try {
                await API.client.put(key, data[key])
              } catch (error) {
                setStore(store => ({
                  ...store,
                  status: { ...store.status, [key]: `` },
                  error: { ...store.error, [key]: API.utilities.getErrorMessage(error) || `unknown` }
                }))
              }
            })
            break

          default:
            Object.keys(data).forEach(async key => {
              try {
                await local.set({ [key]: data[key] })
              } catch (error) {
                setStore(store => ({
                  ...store,
                  status: { ...store.status, [key]: `` },
                  error: { ...store.error, [key]: String(error) || `unknown` }
                }))
              }
            })
        }

        return {
          ...store,
          data: { ...store.data, ...data },
          status: { ...store.status, ...copyObjectWithValue(data, `updating`) },
          error: { ...store.error, ...copyObjectWithValue(data, ``) }
        }
      })
    },

    set: (valueFunc) => {
      setStore(store => {
        const value = valueFunc(store)

        if (!value) {
          return store
        }

        return {
          ...store,
          ...value
        }
      })
    }
  })

  React.useEffect(() => {
    local.set({ source: store.source })
    setStore(store => ({ ...store, isInitialized: false, status: {}, error: {} }))
  }, [ store.source ])

  React.useEffect(() => {
    local.set({ serverBaseURL: store.serverBaseURL })
    API.client.defaults.baseURL = store.serverBaseURL
    setStore(store => ({ ...store, isInitialized: false, status: {}, error: {} }))
  }, [ store.serverBaseURL ])

  if (!store.isConfigured) {
    const configure = async () => {
      const { source, serverBaseURL } = await local.get([`source`, `serverBaseURL`])

      setStore(store => ({
        ...store,
        isConfigured: true,
        source: source || store.source,
        serverBaseURL: serverBaseURL || store.serverBaseURL
      }))
    }

    configure()
  } else if (!store.isInitialized) {
    const initializedRef = initialize(store)

    for (let key in store.data) {
      store.getData(key)
    }

    setStore(store => ({ ...store, isInitialized: true, initializedRef }))
  } else {
    // Update `store` reference used within `tab.onMessage`.
    store.initializedRef.store = store
  }

  return store.isInitialized && (
    <Context.Provider value={store}>
      {children}
    </Context.Provider>
  )
}

export default Provider
