import React from 'react'
import styled from 'styled-components'
import * as UI from '../../UI'
import * as Store from '../Store'
import * as Tests from '../Tests'
import Route from './Route'
import tab from '../../tab'

// Customize the default UI.Form a bit.
export const Form = styled(UI.Form)`
  position: relative;
  margin: 0 auto 75px;

  > section {
    margin-bottom: 30px;

    &:last-of-type {
      text-align: center;

      > ${UI.Button} {
        padding: 5px 30px;
      }
    }
  }

  > ${UI.Footer} {
    height: 50px;
    padding: 0;

    > div {
      position: relative;
      width: 600px;
      height: 100%;
      max-width: 100%;
      padding: 10px;
      margin: 0 auto;
      font-size: 20px;
      line-height: 30px;
      background: #343434;
      box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.05);

      > span {
        display: inline-block;
        vertical-align: top;
        font-size: 20px;
        line-height: 30px;

        &:first-child {
          width: 30px;
          height: 30px;
          margin-right: 5px;
        }
      }

      > aside {
        position: absolute;
        top: 10px;
        right: 10px;

        > ${UI.Button} {
          vertical-align: top;
          font-size: 20px;

          ~ ${UI.Button} {
            margin-left: 5px;
          }
        }
      }
    }
  }
`

const Editor = () => {
  const [ autoFocusIndex, setAutoFocusIndex ] = React.useState(-1)

  return (
    <Store.Context.Consumer>
      {store => {
        const { data, error, set, setData } = store
        const { viewing, recording, testing } = data

        const updateRoute = ({ index, updates }) => setData(data => {
          const routes = [ ...data.routes ]
          routes[index] = { ...routes[index], ...updates }
          return { routes }
        })

        const deleteRoute = ({ index }) => setData(data => {
          const routes = [ ...data.routes ]
          routes.splice(index, 1)
          return { routes }
        })

        return (viewing.routeIndex < 0 || !data.routes[viewing.routeIndex]) ? (
          <Form>
            {data.routes.map((route, index) => {
              const autoFocus = autoFocusIndex === index

              if (autoFocus) {
                setTimeout(() => setAutoFocusIndex(-1))
              }

              return (
                <Route
                  key={`Route_${index}`}
                  recording={recording}
                  testing={testing}
                  set={set}
                  setData={setData}
                  index={index}
                  route={route}
                  updateRoute={updateRoute}
                  deleteRoute={deleteRoute}
                  autoFocus={autoFocus}
                />
              )
            })}

            <section>
              <UI.Button onClick={() => setData(data => {
                const routes = [ ...data.routes ]

                routes.push({
                  path: `/`,
                  exact: false,
                  strict: false,
                  skip: false,
                  tests: []
                })

                setAutoFocusIndex(routes.length - 1)

                return { routes }
              })}>
                <span>Add Route</span>
              </UI.Button>

              <UI.Error>
                {error.routes || ``}
              </UI.Error>
            </section>

            <UI.Footer fixed={true}>
              <div>
                <UI.StateIcon
                  recording={recording}
                  testing={testing}
                  state={data.state}
                  width={30}
                  height={30}
                />

                <span style={{ paddingTop: 1 }}>
                  {data.routes.length} Route{data.routes.length === 1 ? `` : `s`}
                </span>

                {recording.routeIndex > -1 && (
                  <aside>
                    <UI.Button backgroundColor='red' onClick={() => setData(data => {
                      tab.sendMessage({ command: `stopRecording` })

                      return {
                        recording: {
                          routeIndex: -1,
                          testIndex: -1
                        }
                      }
                    })}>
                      <span>Stop Recording</span>
                    </UI.Button>
                  </aside>
                )}

                {testing.routeIndex > -1 && (
                  <aside>
                    <UI.Button backgroundColor='red' onClick={() => setData(data => {
                      tab.sendMessage({ command: `stopTesting` })

                      return {
                        testing: {
                          routeIndex: -1,
                          testIndex: -1,
                          recordedItemIndex: -1,
                          allRoutes: false,
                          allTests: false
                        }
                      }
                    })}>
                      <span>Stop Testing</span>
                    </UI.Button>
                  </aside>
                )}

                {recording.routeIndex < 0 && testing.routeIndex < 0 && data.routes.some(route => !route.skip && route.tests.some(test => !test.skip && test.recorded.length > 0)) && (
                  <aside>
                    <UI.Button backgroundColor='green' onClick={() => setData(data => {
                      let routeIndex = -1
                      let testIndex = -1
                      const routes = data.routes.map((route, index) =>  {
                        if (route.skip || !route.tests.some(test => !test.skip && test.recorded.length > 0)) {
                          return route
                        }

                        if (routeIndex < 0) {
                          routeIndex = index
                        }

                        return {
                          ...route,
                          tests: route.tests.map((test, index) => {
                            if (test.skip || !test.recorded.length) {
                              return test
                            }

                            if (testIndex < 0) {
                              testIndex = index
                            }

                            return {
                              ...test,
                              recorded: test.recorded.map(recordedItem => ({
                                ...recordedItem,
                                state: undefined,
                                error: undefined
                              })),
                              state: undefined
                            }
                          }),
                          state: undefined
                        }
                      })

                      if (routeIndex < 0 || testIndex < 0) {
                        return
                      }

                      return {
                        routes,

                        recording: {
                          routeIndex: -1,
                          testIndex: -1
                        },

                        testing: {
                          routeIndex,
                          testIndex,
                          recordedItemIndex: 0,
                          allRoutes: true,
                          allTests: true
                        },

                        state: undefined
                      }
                    })}>
                      <span>Run All Tests</span>
                    </UI.Button>
                  </aside>
                )}
              </div>
            </UI.Footer>
          </Form>
        ) : (
          <Tests.Editor store={store} />
        )
      }}
    </Store.Context.Consumer>
  )
}

export default Editor
