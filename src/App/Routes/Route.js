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

const Route = styled(({
  recording,
  testing,
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

    setData(data => {
      const routes = data.routes && [ ...data.routes ]
      const route = routes[index] && { ...routes[index] }
      let testIndex = -1

      if (!route) {
        return
      }

      routes[index] = route
      route.state = ``
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
            state: ``,
            error: null
          })),
          state: ``
        }
      })

      return {
        routes,

        recording: {
          routeIndex: -1,
          testIndex: -1
        },

        testing: {
          routeIndex: index,
          testIndex,
          recordedItemIndex: 0,
          allRoutes: false,
          allTests: true
        }
      }
    })
  }

  const stopTesting = () => {
    setData(data => {
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
    })
  }

  const testItems = route.tests.length ? route.tests.map((test, testIndex) => (
    <div key={`Test_${testIndex}`} style={{ opacity: test.skip ? 0.25 : 1 }}>
      <UI.StateIcon
        recording={recording}
        testing={testing}
        routeIndex={index}
        testIndex={testIndex}
        state={test.state}
      />

      <span>{test.description}</span>
    </div>
  )) : (
    <span>No tests.</span>
  )

  return (
    <section { ...props }>
      <PathInput
        index={index}
        route={route}
        autoFocus={autoFocus}
        updateRoute={updateRoute}
      />

      <footer>
        <details open={isOpen} onToggle={({ target }) => setIsOpen(target.open)}>
          <summary>
            <UI.StateIcon
              recording={recording}
              testing={testing}
              routeIndex={index}
              state={route.state}
              iconKey={isOpen ? `chevron-down` : `chevron-right`}
              width={22}
              height={22}
              style={{ padding: 4 }}
            />

            <span>
              {route.tests.length} Test{route.tests.length === 1 ? `` : `s`}
            </span>
          </summary>

          <div>
            {testItems}
          </div>
        </details>

        {testing.routeIndex < 0 && (
          <aside>
            {route.tests.length > 0 && (
              <UI.Button backgroundColor='gray' onClick={() => {
                setIsOpen(false)
                setIsErasing(true)
              }}>
                <span>Erase</span>
              </UI.Button>
            )}

            <UI.Button onClick={() => setData(data => ({ viewing: { routeIndex: index }}))}>
              <span>Edit Tests</span>
            </UI.Button>

            {route.tests.some(test => !test.skip && test.recorded.length > 1) && (
              <UI.Button backgroundColor='green' onClick={() => startTesting()}>
                <span>Run Tests</span>
              </UI.Button>
            )}
          </aside>
        )}

        {testing.routeIndex === index && (
          <aside>
            <UI.Button onClick={() => setData(data => ({ viewing: { routeIndex: index }}))}>
              <span>View Tests</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => stopTesting()}>
              <span>Stop Testing</span>
            </UI.Button>
          </aside>
        )}
      </footer>

      <UI.Button backgroundColor='red' onClick={() => {
        stopTesting()
        setIsOpen(false)
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
              updateRoute({ index, updates: { tests: [], state: `` } })
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
  box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.05);
  opacity: ${({ route }) => route.skip ? 0.25 : 1};
  transition: opacity 0.25s ease-in-out;

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
    background: ${({ theme }) => mix(0.5, theme.colors.background, `rgba(127, 127, 127, 0.25)`)};

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

        > span {
          display: inline-block;
          font-size: 15px;
          margin-left: 29px;
        }

        > div {
          position: relative;
          display: block;
          min-height: 30px;
          font-size: 15px;
          line-height: 20px;
          padding: 2.5px 15px 2.5px 47.5px;

          > span {
            display: inline-block;
            vertical-align: middle;

            &:first-child {
              position: absolute;
              left: 27px;
              top: 6px;
              width: 15px;
              height: 15px;
            }
          }
        }
      }
    }

    > aside {
      position: absolute;
      top: 5px;
      right: 5px;
      opacity: 0;
      transition: opacity 0.25s ease-in-out;

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

  &:hover {
    box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.1);
    opacity: 1;

    > ${UI.Button} {
      opacity: 0.75;

      &:hover {
        opacity: 1;
      }
    }

    > footer {
      > aside {
        opacity: 1;
      }
    }
  }
`

export default Route
