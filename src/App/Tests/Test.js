import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import octicons from 'octicons'
import * as UI from '../../UI'
import EventSelection from './EventSelection'
import RecordedItem from './RecordedItem'
import actionableEventTypes from './actionableEventTypes'
import tab from '../../tab'

export const hasOneSelected = ({ eventTypesGroup, test }) => {
  for (let eventType of eventTypesGroup[1]) {
    if (test.eventTypes.includes(eventType)) {
      return true
    }
  }

  return false
}

export const Summary = styled(({ color, ...props }) => (
  <summary { ...props } />
))`
  > span {
    &:first-child {
      color: ${({ color, theme }) => theme.colors[color] || color || `inherit`};
    }
  }
`

const Test = styled(({
  recording,
  testing,
  set,
  setData,
  routeIndex,
  index,
  test,
  updateTest,
  deleteTest,
  autoFocus,
  ...props
}) => {
  const [ showingMore, setShowingMore ] = React.useState(false)
  const [ isDeleting, setIsDeleting ] = React.useState(false)
  const [ isErasing, setIsErasing ] = React.useState(false)
  const [ isOpen, setIsOpen ] = React.useState(false)

  const startRecording = () => {
    setIsOpen(true)

    set(store => ({
      recording: {
        routeIndex,
        testIndex: index
      },

      testing: {
        routeIndex: -1,
        testIndex: -1,
        allRoutes: false,
        allTests: false
      }
    }))

    // TODO tab.sendMessage({ command: `startRecording`, test })
  }

  const stopRecording = () => {
    set(store => ({
      recording: {
        routeIndex: -1,
        testIndex: -1
      }
    }))

    tab.sendMessage({ command: `stopRecording` })
  }

  const startTesting = () => {
    setIsOpen(true)

    set(store => ({
      recording: {
        routeIndex: -1,
        testIndex: -1
      },

      testing: {
        routeIndex,
        testIndex: index,
        allRoutes: false,
        allTests: false
      }
    }))

    setData(data => {
      const routes = [ ...data.routes ]
      const tests = [ ...routes[routeIndex].tests ]
      const recorded = tests[index].recorded.map(recordedItem => ({
        ...recordedItem,
        passed: undefined,
        error: undefined
      }))

      tests[index] = {
        ...tests[index],
        recorded
      }

      routes[routeIndex] = {
        ...routes[routeIndex],
        tests
      }

      return { routes }
    })

    // TODO setTimeout(() => tab.sendMessage({ command: `startTesting`, test }), 10) // TODO find a better way?
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

    tab.sendMessage({ command: `stopTesting` })
  }

  const updateRecordedItem = ({ index, updates }) => {
    const recorded = [ ...test.recorded ]
    recorded[index] = { ...recorded[index], ...updates }
    updateTest({ index, updates: { recorded } })
  }

  const deleteRecordedItem = ({ index }) => {
    const recorded = [ ...test.recorded ]
    recorded.splice(index, 1)
    updateTest({ index, updates: { recorded } })
  }

  let testItemIndex = 0
  let passedCount = 0
  let failedCount = 0
  let snapshotCount = 0
  let eventCount = 0

  const isTesting = testing.testIndex === index
  const getRecordedItemColor = ({ recordedItem, index }) => {
    let color = `inherit`

    if (recordedItem.passed === true) {
      passedCount++
      testItemIndex++
      color = `green`
    } else if (recordedItem.passed === false) {
      failedCount++
      testItemIndex++
      color = `red`
    } else if (isTesting && testItemIndex === index) {
      color = `yellow`
    }

    if (typeof recordedItem.html !== `undefined`) {
      snapshotCount++
    } else {
      eventCount++
    }

    return color
  }

  const recordedItems = (
    <div>
      {test.recorded.length ? test.recorded.map((recordedItem, index) => (
        <RecordedItem
          key={`recordedItem_${index}`}
          index={index}
          recordedItem={recordedItem}
          updateRecordedItem={updateRecordedItem}
          deleteRecordedItem={deleteRecordedItem}
          color={getRecordedItemColor({ recordedItem, index })}
        />
      )) : (
        <div style={{ backgroundColor: `rgba(127, 127, 127, 0.1)` }}>
          <span style={{ marginLeft: 3 }}>Nothing recorded.</span>
        </div>
      )}
    </div>
  )

  return (
    <section { ...props }>
      <UI.Input
        width='60%'
        placeholder='Test Description'
        value={test.description || ``}
        onBlur={event => {
          if (event.target.value !== test.description) {
            updateTest({ index, updates: { description: event.target.value } })
          }
        }}
        autoFocus={autoFocus}
      >
        <aside>
          <label>
            <input
              type='checkbox'
              checked={test.skip}
              onChange={event => {
                const skip = event.target.checked
                updateTest({ index, updates: { skip } })
              }}
            />

            <span>Skip</span>
          </label>
        </aside>
      </UI.Input>

      <UI.Input
        width='40%'
        placeholder='Snapshot Container Selector'
        value={test.snapshotSelector || `html`}
        onBlur={event => {
          if (event.target.value !== test.snapshotSelector) {
            updateTest({ index, updates: { snapshotSelector: event.target.value } })
          }
        }}
      />

      {test.recorded.length === 0 && (
        <React.Fragment>
          <header>Events to Record</header>

          {actionableEventTypes.map((eventTypesGroup, eventTypesGroupIndex) => (
            <EventSelection
              key={`EventSelection_${index}_${eventTypesGroupIndex}`}
              style={(showingMore || (!test.eventTypes.length && eventTypesGroupIndex < 2) || hasOneSelected({ eventTypesGroup, test })) ? undefined : { display: `none` }}
              eventTypesGroup={eventTypesGroup}
              eventTypes={test.eventTypes}
              index={index}
              updateTest={updateTest}
            />
          ))}

          {showingMore ? (
            <div>
              <span onClick={() => setShowingMore(false)}>
                Show Less...
              </span>
            </div>
          ) : (
            <div>
              <span onClick={() => setShowingMore(true)}>
                Show More...
              </span>
            </div>
          )}
        </React.Fragment>
      )}

      {recording.testIndex === index && (
        <footer>
          <details open={isOpen} onToggle={({ target }) => setIsOpen(target.open)}>
            <Summary color='red'>
              <span
                dangerouslySetInnerHTML={{
                  __html: octicons[`primitive-dot`].toSVG({ width: 30, height: 30 })
                }}
              />

              <span style={{ fontSize: 20 }}>
                RECORDING
              </span>
            </Summary>

            {recordedItems}
          </details>

          <aside>
            <UI.Button backgroundColor='red' onClick={() => stopRecording()}>
              Stop
            </UI.Button>
          </aside>
        </footer>
      )}

      {testing.testIndex === index && (
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

            {recordedItems}
          </details>

          <aside>
            <UI.Button backgroundColor='red' onClick={() => stopTesting()}>
              Stop
            </UI.Button>
          </aside>
        </footer>
      )}

      {recording.testIndex !== index && testing.testIndex !== index && (
        <footer>
          <details open={isOpen} onToggle={({ target }) => setIsOpen(target.open)}>
            <Summary color={test.allPassed ? `green` : (test.oneFailed ? `red` : `inherit`)}>
              <span
                style={{ padding: 4 }}
                dangerouslySetInnerHTML={{
                  __html: octicons[(test.recorded.length > 0 && passedCount === test.recorded.length) ? `check` : (failedCount > 0 ? `x` : (isOpen ? `chevron-down` : `chevron-right`))].toSVG({ width: 22, height: 22 })
                }}
              />

              <span>
                {snapshotCount} Snapshot{snapshotCount === 1 ? `` : `s`}, {eventCount} Event{eventCount === 1 ? `` : `s`}
              </span>
            </Summary>

            {recordedItems}
          </details>

          {test.recorded.length > 0 ? (
            <aside>
              <UI.Button backgroundColor='gray' onClick={() => setIsErasing(true)}>
                Erase
              </UI.Button>

              <UI.Button backgroundColor='green' onClick={() => startTesting()}>
                Run Test
              </UI.Button>
            </aside>
          ) : (
            <aside>
              <UI.Button backgroundColor='green' onClick={() => startRecording()}>
                Record
              </UI.Button>
            </aside>
          )}
        </footer>
      )}

      <UI.Button backgroundColor='red' onClick={() => {
        if (recording.testIndex === index) {
          stopRecording()
        }

        if (testing.testIndex === index) {
          stopTesting()
        }

        setIsDeleting(true)
      }}>
        <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 14, height: 14 }) }} />
      </UI.Button>

      {isDeleting && (
        <center>
          <div>
            <div>Delete this test?</div>

            <UI.Button backgroundColor='gray' onClick={() => setIsDeleting(false)}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
              <span>Cancel</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsDeleting(false)
              deleteTest({ index })
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
            <div>Erase recorded snapshots and events?</div>

            <UI.Button backgroundColor='gray' onClick={() => setIsErasing(false)}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
              <span>Cancel</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsErasing(false)
              updateTest({ index, updates: { recorded: [] } })
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

  > header {
    margin-top: 10px;
    padding: 3px;
    font-size: 11px;
    line-height: 1;
    color: gray;
    text-transform: uppercase;
    pointer-events: none;
  }

  > div {
    margin-bottom: 10px;
    padding: 6px 0 6px 37px;
    font-size: 13px;
    line-height: 1;

    > span {
      color: gray;
      cursor: pointer;

      &:hover {
        color: inherit;
        text-decoration: underline;
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

export default Test
