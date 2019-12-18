import React from 'react'
import styled from 'styled-components'
import octicons from 'octicons'
import * as UI from '../../UI'
import Test from './Test'
import { PathInput } from '../Routes/Route'
import tab from '../../tab'

// Customize the default UI.Form a bit.
export const Form = styled(UI.Form)`
  position: relative;
  margin: 0 auto 75px;

  > header {
    margin-bottom: 5px;

    > ${UI.Button} {
      margin-left: -3px;
      padding-left: 0;
      opacity: 0.5;
      transition: opacity 0.25s ease-in-out;

      > span {
        ~ span {
          margin-left: 3px;
          margin-right: 0;
        }
      }

      &:hover {
        opacity: 1;
      }
    }
  }

  > center {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    font-size: 18px;
    padding-bottom: 7.5px;
    background: ${({ theme }) => theme.colors.background};
    border: 1px solid ${({ theme }) => theme.colors.red || `red`};

    > div {
      > div {
        margin-bottom: 5px;
      }

      > ${UI.Button} {
        height: 30px;
        padding: 7px;
        font-size: 18px;
        line-height: 20px;

        > span {
          height: 17px;
          line-height: 15px;

          + span {
            height: 15px;
          }
        }

        + ${UI.Button} {
          margin-left: 10px;
        }
      }
    }
  }

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

const Editor = ({ store }) => {
  const { data, error, set, setData } = store
  const { viewing, recording, testing } = data
  const [ autoFocusIndex, setAutoFocusIndex ] = React.useState(-1)
  const [ isDeleting, setIsDeleting ] = React.useState(false)

  const { routeIndex } = viewing
  const route = data.routes[routeIndex]

  const updateRoute = ({ updates }) => setData(data => {
    const routes = [ ...data.routes ]
    routes[routeIndex] = { ...routes[routeIndex], ...updates }
    return { routes }
  })

  const deleteRoute = () => setData(data => {
    const routes = [ ...data.routes ]
    routes.splice(routeIndex, 1)
    return { routes }
  })

  const updateTest = ({ index, updates }) => setData(data => {
    const routes = [ ...data.routes ]
    const tests = [ ...routes[routeIndex].tests ]

    tests[index] = { ...tests[index], ...updates }
    routes[routeIndex] = { ...routes[routeIndex], tests }

    return { routes }
  })

  const deleteTest = ({ index }) => setData(data => {
    const routes = [ ...data.routes ]
    const tests = [ ...routes[routeIndex].tests ]

    tests.splice(index, 1)
    routes[routeIndex] = { ...routes[routeIndex], tests }

    return { routes }
  })

  return (
    <Form>
      <header>
        <UI.Button backgroundColor='transparent' onClick={() => setData(data => ({ viewing: { routeIndex: -1 } }))}>
          <span dangerouslySetInnerHTML={{ __html: octicons[`arrow-left`].toSVG({ width: 20, height: 20 }) }} />
          <span>Routes</span>
        </UI.Button>
      </header>

      <PathInput
        routeIndex={routeIndex}
        route={data.routes[routeIndex]}
        updateRoute={updateRoute}
        style={{ marginBottom: 45 }}
      />

      {isDeleting ? (
        <center>
          <div>
            <div>Delete this route and all of its tests?</div>

            <UI.Button backgroundColor='gray' onClick={() => {
              setIsDeleting(false)
            }}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
              <span>Cancel</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsDeleting(false)
              setData(data => ({ viewing: { routeIndex: -1 } }))
              deleteRoute()
            }}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
              <span>Delete</span>
            </UI.Button>
          </div>
        </center>
      ) : (
        <React.Fragment>
          {route.tests.map((test, testIndex) => {
            const autoFocus = autoFocusIndex === testIndex

            if (autoFocus) {
              setTimeout(() => setAutoFocusIndex(-1))
            }

            return (
              <Test
                key={`Test_${routeIndex}_${testIndex}`}
                recording={recording}
                testing={testing}
                set={set}
                setData={setData}
                routeIndex={routeIndex}
                index={testIndex}
                test={test}
                updateTest={updateTest}
                deleteTest={deleteTest}
                autoFocus={autoFocus}
              />
            )
          })}

          <section>
            <UI.Button onClick={() => setData(data => {
              const routes = [ ...data.routes ]
              const tests = [ ...routes[routeIndex].tests ]

              tests.push({
                description: ``,
                snapshotSelector: (tests[tests.length - 1] && tests[tests.length - 1].snapshotSelector) || `html`,
                eventTypes: [ `click`, `input`, `change` ],
                recorded: [],
                skip: false
              })

              routes[routeIndex] = { ...routes[routeIndex], tests }

              setAutoFocusIndex(tests.length - 1)

              return { routes }
            })}>
              <span>Add Test</span>
            </UI.Button>

            <UI.Error>
              {error.tests || ``}
            </UI.Error>
          </section>
        </React.Fragment>
      )}

      <UI.Footer fixed={true}>
        <div>
          <UI.StateIcon
            recording={recording}
            testing={testing}
            routeIndex={routeIndex}
            state={route.state}
            width={30}
            height={30}
          />

          <span style={{ paddingTop: 1 }}>
            {route.tests.length} Test{route.tests.length === 1 ? `` : `s`}
          </span>

          {recording.routeIndex === routeIndex && (
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

          {testing.routeIndex === routeIndex && (
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

          {recording.routeIndex < 0 && testing.routeIndex < 0 && route.tests.some(test => !test.skip && test.recorded.length > 0) && (
            <aside>
              <UI.Button backgroundColor='green' onClick={() => setData(data => {
                const routes = data.routes && [ ...data.routes ]
                const route = routes[routeIndex] && { ...routes[routeIndex] }
                let testIndex = -1

                if (!route) {
                  return
                }

                routes[routeIndex] = route
                route.state = undefined
                route.tests = route.tests.map((test, index) => {
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
                })

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
                    allRoutes: false,
                    allTests: true
                  }
                }
              })}>
                <span>Run Tests</span>
              </UI.Button>
            </aside>
          )}
        </div>
      </UI.Footer>
    </Form>
  )
}

export default Editor
