import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import octicons from 'octicons'
import * as UI from '../../UI'
import tab from '../../tab'

export const PathInput = styled(({ index, route, autoFocus, updateRoute, ...props }) => (
  <div { ...props }>
    <UI.Input
      placeholder='Path'
      value={route.path}
      autoFocus={autoFocus}
      onChange={(event) => {
        const path = event.target.value

        if (path !== route.path) {
          updateRoute({ index, updates: { path } })
        }
      }}
    />

    <aside>
      <label>
        <input
          type='checkbox'
          checked={route.exact}
          onChange={event => {
            const exact = event.target.checked
            updateRoute({ index, updates: { exact } })
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
            updateRoute({ index, updates: { strict } })
          }}
        />

        <span>Strict</span>
      </label>

      <label>
        <input
          type='checkbox'
          checked={route.skip}
          onChange={event => {
            const skip = event.target.checked
            updateRoute({ index, updates: { skip } })
          }}
        />

        <span>Skip</span>
      </label>
    </aside>
  </div>
))`
  position: relative;

  > ${UI.Input} {
    width: 100%;
  }

  > aside {
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
  }

  > ${UI.Button} {
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
  }

  &:hover {
    > ${UI.Button} {
      opacity: 0.75;
    }
  }
`

export const Summary = styled(({ color, ...props }) => (
  <summary { ...props } />
))`
  > span {
    &:first-child {
      color: ${({ color, theme }) => theme.colors[color] || color || `inherit`};
    }
  }
`

const Route = styled(({
  testing,
  set,
  setData,
  index,
  route,
  updateRoute,
  deleteRoute,
  autoFocus,
  ...props
}) => {
  const [ isDeleting, setIsDeleting ] = React.useState(false)
  const [ isErasing, setIsErasing ] = React.useState(false)
  const [ isOpen, setIsOpen ] = React.useState(false)

  const startTesting = () => {
    setIsOpen(true)

    set(store => ({
      recording: {
        routeIndex: -1,
        testIndex: -1
      },

      testing: {
        routeIndex: index,
        testIndex: 0,
        allRoutes: false,
        allTests: true
      }
    }))

    // TODO setTimeout(() => tab.sendMessage({ command: `startTesting`, route }), 10) // TODO find a better way?
  }

  const stopTesting = () => {
    set(store => ({
      testing: {
        routeIndex: -1,
        testIndex: -1,
        allRoutes: false,
        allTests: false
      }
    }))

    // TODO tab.sendMessage({ command: `stopTesting` })
  }

  const testItems = (
    <div>
      {route.tests.length ? route.tests.map((test, testIndex) => (
        <div key={`Test_${testIndex}`}>
          <span dangerouslySetInnerHTML={{ __html: octicons[`check`].toSVG({ width: 15, height: 15 }) }} />
          <span>{test.description}</span>
        </div>
      )) : (
        <div>
          <span style={{ marginLeft: 3 }}>No tests.</span>
        </div>
      )}
    </div>
  )

  return (
    <section { ...props }>
      <PathInput
        index={index}
        route={route}
        autoFocus={autoFocus}
        updateRoute={updateRoute}
      />

      {testing.routeIndex === index ? (
        <footer>
          <details open={isOpen} onToggle={({ target }) => setIsOpen(target.open)}>
            <Summary color='yellow'>
              <UI.Rotate
                style={{ padding: 4 }}
                dangerouslySetInnerHTML={{
                  __html: octicons[`sync`].toSVG({ width: 22, height: 22 })
                }}
              />

              <span style={{ fontSize: 20 }}>
                RUNNING TESTS
              </span>
            </Summary>

            {testItems}
          </details>

          <aside>
            <UI.Button backgroundColor='red' onClick={() => stopTesting()}>
              Stop
            </UI.Button>
          </aside>
        </footer>
      ) : (
        <footer>
          <details open={isOpen} onToggle={({ target }) => setIsOpen(target.open)}>
            <Summary color={route.allTestsPassed ? `green` : (route.oneTestFailed ? `red` : `inherit`)}>
              <span
                style={{ padding: 4 }}
                dangerouslySetInnerHTML={{
                  __html: octicons[route.allTestsPassed ? `check` : (route.oneTestFailed ? `x` : (isOpen ? `chevron-down` : `chevron-right`))].toSVG({ width: 22, height: 22 })
                }}
              />

              <span>
                {route.tests.length} Test{route.tests.length === 1 ? `` : `s`}
              </span>
            </Summary>

            {testItems}
          </details>

          <aside>
            {route.tests.length > 0 && (
              <UI.Button backgroundColor='gray' onClick={() => setIsErasing(true)}>
                Erase
              </UI.Button>
            )}

            <UI.Button onClick={() => set(store => ({ editing: { routeIndex: index }}))}>
              {route.tests.length > 0 ? `Edit Tests` : `Add Tests`}
            </UI.Button>

            {route.tests.length > 0 && (
              <UI.Button backgroundColor='green' onClick={() => startTesting()}>
                Run Tests
              </UI.Button>
            )}
          </aside>
        </footer>
      )}

      <UI.Button backgroundColor='red' onClick={() => {
        if (testing.routeIndex === index) {
          stopTesting()
        }

        setIsDeleting(true)
      }}>
        <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 14, height: 14 }) }} />
      </UI.Button>

      {isDeleting && (
        <center>
          <div>
            <div>Delete this route and all of its tests?</div>

            <UI.Button backgroundColor='gray' onClick={() => setIsDeleting(false)}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
              <span>Cancel</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsDeleting(false)
              deleteRoute({ index })
            }}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
              <span>Delete</span>
            </UI.Button>
          </div>
        </center>
      )}

      {isErasing && (
        <center>
          <div>
            <div>Erase all tests for this route?</div>

            <UI.Button backgroundColor='gray' onClick={() => setIsErasing(false)}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
              <span>Cancel</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsErasing(false)
              updateRoute({ index, updates: { tests: [] } })
            }}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
              <span>Erase</span>
            </UI.Button>
          </div>
        </center>
      )}
    </section>
  )
})`
  position: relative;
  margin-bottom: 30px;
  box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.05);

  &&& > ${UI.Input} {
    margin-bottom: 0;

    > aside {
      position: absolute;
      top: 0;
      left: 125px;
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
    }
  }

  > ${UI.Button} {
    position: absolute;
    top: 0;
    right: 0;
    height: 20px;
    padding: 0 3px;
    line-height: 15px;
    font-size: 15px;
    opacity: 0;
    transition: opacity 0.25s ease-in-out;

    > span {
      height: 15px;

      ~ span {
        margin-left: 2px;
      }
    }
  }

  > footer {
    position: relative;
    padding: 5px;
    background: ${({ theme }) => mix(0.5, theme.colors.background, `rgba(127, 127, 127, 0.5)`)};

    > details {
      > summary {
        font-size: 18px;
        line-height: 30px;

        &::-webkit-details-marker {
          display: none;
        }

        > span {
          display: inline-block;
          vertical-align: top;
          cursor: pointer;
          font-size: 18px;
          line-height: 30px;

          &:first-child {
            width: 30px;
            height: 30px;
          }
        }

        > footer {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 5px;
          font-size: 15px;
          line-height: 15px;
          color: ${({ theme }) => theme.colors.yellow};
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.25s ease-in-out;

          > span {
            display: inline-block;
            vertical-align: top;

            &:first-child {
              margin: 1px 5px 0 0;
            }
          }
        }
      }

      > div {
        position: relative;
        margin-top: 5px;
        margin-bottom: 15px;

        > div {
          position: relative;
          display: block;
          min-height: 30px;
          font-size: 15px;
          line-height: 20px;
          padding: 5px 80px 5px 50px;

          > span {
            display: inline-block;
            vertical-align: middle;

            &:first-child {
              position: absolute;
              left: 30px;
              top: 7.5px;
            }
          }
        }
      }
    }

    > aside {
      position: absolute;
      top: 5px;
      right: 5px;

      > ${UI.Button} {
        ~ ${UI.Button} {
          margin-left: 5px;
        }
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

  &:hover {
    box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.1);

    > ${UI.Button} {
      opacity: 0.75;

      &:hover {
        opacity: 1;
      }
    }
  }
`

export default Route
