import React from 'react'
import styled from 'styled-components'
import octicons from 'octicons'
import * as UI from '../../UI'
import * as Store from '../Store'
import Test from './Test'

// Customize the default UI.Form a bit.
export const Form = styled(UI.Form)`
  position: relative;
  margin: 0 auto;

  ${UI.Combo},
  ${UI.Input},
  ${UI.List},
  ${UI.Select},
  ${UI.Textarea} {
    width: 100%;
    margin-bottom: 10px;
  }

  > ${UI.Combo} {
    margin-bottom: 45px;

    > b {
      padding: 20px 3px 0 4px;
      width: 19px;
      line-height: 20px;
    }

    + aside {
      position: absolute;
      top: 0;
      left: 45px;
      text-transform: uppercase;
      white-space: nowrap;

      > label {
        display: inline-block;
        vertical-align: top;
        margin-right: 12px;
        font-size: 11px;
        line-height: 1;
        cursor: pointer;

        > input {
          margin: 1px 3px;

          &:checked + span {
            color: rgba(255, 255, 255, 0.9);
          }
        }

        > span {
          color: gray;
        }

        &:hover {
          > span {
            color: inherit;
          }
        }
      }

      + ${UI.Button} {
        position: absolute;
        top: 0;
        right: 0;
        height: 20px;
        padding: 0 3px;
        line-height: 15px;
        font-size: 15px;
        opacity: 0;
        transition: opacity 0.25s ease-in-out;

        &:hover {
          opacity: 1;
        }

        > span {
          height: 15px;

          ~ span {
            margin-left: 2px;
          }
        }

        + center {
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          font-size: 18px;
          padding-bottom: 15px;
          background: ${({ theme }) => theme.colors.background};

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
      }
    }

    &:hover {
      + aside {
        + ${UI.Button} {
          opacity: 0.75;
        }
      }
    }
  }

  > footer {
    margin-bottom: 45px;
    text-align: center;

    > ${UI.Button} {
      padding: 5px 30px;
    }
  }
`

const Editor = () => {
  const [ autoFocusIndex, setAutoFocusIndex ] = React.useState(-1)
  const [ isDeleting, setIsDeleting ] = React.useState(false)

  return (
    <Store.Context.Consumer>
      {({ data, error, set, setData, routeIndex, testIndex, isRecording, isTesting }) => {
        const route = data.routes[routeIndex]

        const updateTest = ({ testIndex, updates }) => setData(data => {
          const routes = [ ...data.routes ]
          const tests = [ ...routes[routeIndex].tests ]

          tests[testIndex] = { ...tests[testIndex], ...updates }
          routes[routeIndex] = { ...routes[routeIndex], tests }

          return { routes }
        })

        const deleteTest = ({ testIndex }) => setData(data => {
          const routes = [ ...data.routes ]
          const tests = [ ...routes[routeIndex].tests ]

          tests.splice(testIndex, 1)
          routes[routeIndex] = { ...routes[routeIndex], tests }

          return { routes }
        })

        return Boolean(route) && (
          <Form>
            <UI.Combo
              id='pathInput'
              placeholder='Path'
              value={routeIndex}
              inputValue={route.path}
              onChange={(event) => {
                const { value } = event.target

                if (value === `add`) {
                  set(store => ({ routeIndex: store.data.routes.length }))

                  setData(data => {
                    const routes = [ ...data.routes ]

                    routes.push({
                      path: `/`,
                      exact: false,
                      strict: false,
                      tests: []
                    })

                    setTimeout(() => {  // TODO is there a better way?
                      document.getElementById(`pathInput`).focus()
                    }, 10)

                    return { routes }
                  })
                } else {
                  set(store => ({ routeIndex: value }))
                }
              }}
              onInput={event => {
                const path = event.target.value

                if (path !== route.path) {
                  setData(data => {
                    const routes = [ ...data.routes ]
                    routes[routeIndex] = { ...route, path }
                    return { routes }
                  })
                }
              }}
            >
              {data.routes.map((route, routeIndex) => (
                <option key={`route_option_${routeIndex}`} value={routeIndex}>
                  {route.path}
                </option>
              ))}

              <option value='add'>Add Another Route...</option>
            </UI.Combo>

            <aside>
              <label>
                <input
                  type='checkbox'
                  checked={route.exact}
                  onChange={event => {
                    const exact = event.target.checked

                    setData(data => {
                      const routes = [ ...data.routes ]
                      routes[routeIndex] = { ...route, exact }
                      return { routes }
                    })
                  }}
                />

                <span>Exact</span>
              </label>

              <label>
                <input
                  type='checkbox'
                  checked={route.strict}
                  onChange={event => {
                    const strict = event.target.checked

                    setData(data => {
                      const routes = [ ...data.routes ]
                      routes[routeIndex] = { ...route, strict }
                      return { routes }
                    })
                  }}
                />

                <span>Strict</span>
              </label>
            </aside>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsDeleting(true)
            }}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
            </UI.Button>

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
                    set(store => ({ routeIndex: 0 }))

                    setData(data => {
                      const routes = [ ...data.routes ]
                      routes.splice(routeIndex, 1)
                      setIsDeleting(false)
                      return { routes }
                    })
                  }}>
                    <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
                    <span>Delete</span>
                  </UI.Button>
                </div>
              </center>
            ) : (
              <React.Fragment>
                {route.tests.map((props, index) => {
                  const autoFocus = autoFocusIndex === index

                  if (autoFocus) {
                    setAutoFocusIndex(-1)
                  }

                  return (
                    <Test
                      key={`Test_${index}`}
                      { ...props }
                      set={set}
                      setData={setData}
                      routeIndex={routeIndex}
                      testIndex={index}
                      updateTest={updateTest}
                      deleteTest={deleteTest}
                      isRecording={isRecording && testIndex === index}
                      isTesting={isTesting && testIndex === index}
                      autoFocus={autoFocus}
                    />
                  )
                })}

                <footer>
                  <UI.Button backgroundColor='green' onClick={() => setData(data => {
                    const routes = [ ...data.routes ]
                    const tests = [ ...routes[routeIndex].tests ]

                    tests.push({
                      description: ``,
                      snapshotSelector: (tests[tests.length - 1] && tests[tests.length - 1].snapshotSelector) || `html`,
                      eventTypes: [ `click`, `input`, `change` ],
                      recorded: []
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
                </footer>
              </React.Fragment>
            )}
          </Form>
        )
      }}
    </Store.Context.Consumer>
  )
}

export default Editor
