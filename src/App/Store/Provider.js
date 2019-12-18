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
  const { routeIndex, testIndex } = store.data.recording

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
 * Sets the `message.result.state` and `message.result.error` (if provided) for the current test item.
 * @param {object} store
 * @param {object} message
 */
const setRecordedItemResult = ({ store, message }) => {
  const { state, error } = message.result

  store.setData(data => {
    let { testing } = data
    let { routeIndex, testIndex, recordedItemIndex, allRoutes, allTests } = testing
    const routes = data.routes && [ ...data.routes ]
    const route = routes && routes[routeIndex] && { ...routes[routeIndex] }
    const tests = route && route.tests && [ ...route.tests ]
    const test = tests && tests[testIndex] && { ...tests[testIndex] }
    const recorded = test && test.recorded && [ ...test.recorded ]

    const stopTesting = () => {
      tab.sendMessage({ command: `stopTesting` })

      testing = {
        routeIndex: -1,
        testIndex: -1,
        recordedItemIndex: -1,
        allRoutes: false,
        allTests: false
      }
    }

    if (!recorded || !recorded[recordedItemIndex]) {
      return
    }

    recorded[recordedItemIndex] = {
      ...recorded[recordedItemIndex],
      state,
      error
    }

    tests[testIndex] = {
      ...test,
      recorded
    }

    routes[routeIndex] = {
      ...route,
      tests
    }

    if (state === `PASSED`) {
      if (recorded[++recordedItemIndex]) {
        // Test the next recorded item.
        testing = { ...testing, recordedItemIndex }
      } else {
        // Reached the end of the recorded items for the current test.
        if (allTests) {
          recordedItemIndex = 0

          // Find the next valid test.
          while (tests[++testIndex]) {
            if (!tests[testIndex].skip && tests[testIndex].recorded.length) {
              break
            }
          }

          if (tests[testIndex]) {
            // Perform the next test.
            testing = { ...testing, testIndex, recordedItemIndex }
          } else {
            // Reached the end of the tests for the current route.
            if (allRoutes) {
              // Find the next valid route and test.
              while (routes[++routeIndex]) {
                if (!routes[routeIndex].skip) {
                  testIndex = -1

                  while (tests[++testIndex]) {
                    if (!tests[testIndex].skip && tests[testIndex].recorded.length) {
                      break
                    }
                  }

                  if (routes[routeIndex].tests[testIndex]) {
                    break
                  }
                }
              }

              if (routes[routeIndex]) {
                // Perform the next test.
                testing = { ...testing, routeIndex, testIndex, recordedItemIndex }
              } else {
                stopTesting()
              }
            } else {
              stopTesting()
            }
          }
        } else {
          stopTesting()
        }
      }
    } else {
      stopTesting()
    }

    return {
      routes,
      testing
    }
  })
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

      case `setRecordedItemResult`:
        setRecordedItemResult({ store: ref.store, message })
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

    data: {
      routes: [/*{
        path: `/`, // Matched via react-router's `matchPath` function.
        exact: false,
        strict: false,
        skip: false,
        state?: ``, // [`PASSED`, `FAILED`]
        tests: [{
          description: ``,
          snapshotSelector: ``,
          eventTypes: [],
          recorded: [recordedItem.html ? {
            html,
            state?: ``, // [`PASSED`, `FAILED`]
            error?: {
              html
            }
          } : {
            eventType,
            targetSelector,
            value?,
            id?,
            name?,
            placeholder?,
            state?: ``, // [`PASSED`, `FAILED`]
            error?: {
              message: ``
            }
          }],
          state?: ``, // [`PASSED`, `FAILED`]
        }]
      }*/],

      viewing: {
        routeIndex: -1,
      },

      recording: {
        routeIndex: -1,
        testIndex: -1
      },

      testing: {
        routeIndex: -1,
        testIndex: -1,
        recordedItemIndex: -1,
        allRoutes: false,
        allTests: false
      },

      state: ``
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

        const nextStore = {
          ...store,
          data: { ...store.data, ...data },
          status: { ...store.status, ...copyObjectWithValue(data, `updating`) },
          error: { ...store.error, ...copyObjectWithValue(data, ``) }
        }

        if (store.data.routes !== nextStore.data.routes) {
          nextStore.data.routes.forEach((route, routeIndex) => {
            if (store.data.routes[routeIndex] !== route) {
              route.tests.forEach((test, testIndex) => {
                if (store.data.routes[routeIndex].tests[testIndex] !== test) {
                  if (test.recorded.length > 0 && !test.recorded.some(recordedItem => recordedItem.state !== `PASSED`)) {
                    test.state = `PASSED`
                  } else if (test.recorded.some(recordedItem => recordedItem.state === `FAILED`)) {
                    test.state = `FAILED`
                  } else {
                    test.state = ``
                  }
                }
              })

              if (route.tests.length > 0 && !route.tests.some(test => !test.skip && test.recorded.length > 0 && test.state !== `PASSED`)) {
                route.state = `PASSED`
              } else if (route.tests.some(test => !test.skip && test.recorded.length > 0 && test.state === `FAILED`)) {
                route.state = `FAILED`
              } else {
                route.state = ``
              }
            }
          })

          if (nextStore.data.routes.length > 0 && !nextStore.data.routes.some(route => !route.skip && route.state !== `PASSED`)) {
            nextStore.data.state = `PASSED`
          } else if (nextStore.data.routes.some(route => !route.skip && route.state === `FAILED`)) {
            nextStore.data.state = `FAILED`
          } else {
            nextStore.data.state = ``
          }
        }

        if (
          store.data.testing !== nextStore.data.testing
          && (
            store.data.testing.routeIndex !== nextStore.data.testing.routeIndex
            || store.data.testing.testIndex !== nextStore.data.testing.testIndex
          )
          && nextStore.data.routes[nextStore.data.testing.routeIndex]
          && nextStore.data.routes[nextStore.data.testing.routeIndex].tests[nextStore.data.testing.testIndex]
        ) {
          setTimeout(() => tab.sendMessage({ // TODO find a better way?
            command: `startTesting`,
            test: nextStore.data.routes[nextStore.data.testing.routeIndex].tests[nextStore.data.testing.testIndex]
          }), 10)
        }

        switch (store.source) {
          case `server`:
            Object.keys(data).forEach(async key => {
              try {
                await API.client.put(key, nextStore.data[key])
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
                await local.set({ [key]: nextStore.data[key] })
              } catch (error) {
                setStore(store => ({
                  ...store,
                  status: { ...store.status, [key]: `` },
                  error: { ...store.error, [key]: String(error) || `unknown` }
                }))
              }
            })
        }

        return nextStore
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
  } else if (!store.initializedRef) {
    const initializedRef = initialize(store)

    for (let key in store.data) {
      store.getData(key)
    }

    setStore(store => ({ ...store, initializedRef }))
  } else {
    // Update `store` reference used within `tab.onMessage`.
    store.initializedRef.store = store

    // Store is initialized when the status for each data key is defined and not 'fetching'.
    if (!store.isInitialized && !Object.keys(store.data).filter(
      key => (typeof store.status[key] === `undefined` || store.status[key] === `fetching`)
    ).length) {
      setStore(store => ({ ...store, isInitialized: true }))

      // Stop the content script just in case it's out of sync with dev tools.
      if (store.data.recording.routeIndex > -1) {
        tab.sendMessage({ command: `stopRecording` })

        store.setData(data => ({
          recording: {
            routeIndex: -1,
            testIndex: -1
          }
        }))
      }

      if (store.data.testing.routeIndex > -1) {
        tab.sendMessage({ command: `stopTesting` })

        store.setData(data => ({
          testing: {
            routeIndex: -1,
            testIndex: -1,
            recordedItemIndex: -1,
            allRoutes: false,
            allTests: false
          }
        }))
      }
    }
  }

  return store.isInitialized && (
    <Context.Provider value={store}>
      {children}
    </Context.Provider>
  )
}

export default Provider
