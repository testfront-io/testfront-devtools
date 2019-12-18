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

const Test = styled(({
  recording,
  testing,
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

    setData(data => {
      tab.sendMessage({ command: `startRecording`, test })

      return {
        recording: {
          routeIndex,
          testIndex: index
        },

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

  const stopRecording = () => {
    setData(data => {
      tab.sendMessage({ command: `stopRecording` })

      return {
        recording: {
          routeIndex: -1,
          testIndex: -1
        }
      }
    })
  }

  const startTesting = () => {
    setIsOpen(true)

    setData(data => {
      const routes = [ ...data.routes ]
      const tests = [ ...routes[routeIndex].tests ]
      const recorded = tests[index].recorded.map(recordedItem => ({
        ...recordedItem,
        state: ``,
        error: null
      }))

      tests[index] = {
        ...tests[index],
        recorded
      }

      routes[routeIndex] = {
        ...routes[routeIndex],
        tests
      }

      return {
        routes,

        recording: {
          routeIndex: -1,
          testIndex: -1
        },

        testing: {
          routeIndex,
          testIndex: index,
          recordedItemIndex: 0,
          allRoutes: false,
          allTests: false
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

  const updateRecordedItem = ({ index: recordedItemIndex, updates }) => {
    const recorded = [ ...test.recorded ]
    recorded[recordedItemIndex] = { ...recorded[recordedItemIndex], ...updates }
    updateTest({ index, updates: { recorded } })
  }

  const deleteRecordedItem = ({ recordedItemIndex }) => {
    const recorded = [ ...test.recorded ]
    recorded.splice(recordedItemIndex, 1)
    updateTest({ index, updates: { recorded } })
  }

  let recordedItems = []
  let snapshotCount = 0
  let eventCount = 0

  if (test.recorded.length) {
    test.recorded.forEach((recordedItem, recordedItemIndex) => {
      recordedItems.push(
        <RecordedItem
          key={`recordedItem_${routeIndex}_${index}_${recordedItemIndex}`}
          recording={recording}
          testing={testing}
          routeIndex={routeIndex}
          testIndex={index}
          index={recordedItemIndex}
          recordedItem={recordedItem}
          updateRecordedItem={updateRecordedItem}
          deleteRecordedItem={deleteRecordedItem}
        />
      )

      if (typeof recordedItem.html !== `undefined`) {
        snapshotCount++
      } else {
        eventCount++
      }
    })
  } else {
    recordedItems = (
      <span>Nothing recorded.</span>
    )
  }

  return (
    <section { ...props }>
      <UI.Input
        width='50%'
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
        width='50%'
        placeholder='Snapshot Container Selector'
        value={test.snapshotSelector || `html`}
        onBlur={event => {
          if (event.target.value !== test.snapshotSelector) {
            updateTest({ index, updates: { snapshotSelector: event.target.value, recorded: [], state: `` } })
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

      <footer>
        <details open={isOpen} onToggle={({ target }) => setIsOpen(target.open)}>
          <summary>
            {recording.routeIndex === routeIndex && recording.testIndex === index ? (
              <UI.StateIcon
                recording={recording}
                testing={testing}
                routeIndex={routeIndex}
                testIndex={index}
                state={test.state}
                width={30}
                height={30}
              />
            ) : (
              <UI.StateIcon
                recording={recording}
                testing={testing}
                routeIndex={routeIndex}
                testIndex={index}
                state={test.state}
                iconKey={isOpen ? `chevron-down` : `chevron-right`}
                width={22}
                height={22}
                style={{ padding: 4 }}
              />
            )}

            <span>
              {snapshotCount} Snapshot{snapshotCount === 1 ? `` : `s`}, {eventCount} Event{eventCount === 1 ? `` : `s`}
            </span>
          </summary>

          <div>
            {recordedItems}
          </div>
        </details>

        {recording.routeIndex < 0 && testing.routeIndex < 0 && (!test.recorded.length ? (
          <aside>
            <UI.Button backgroundColor='green' onClick={() => startRecording()}>
              <span>Record</span>
            </UI.Button>
          </aside>
        ) : (
          <aside>
            <UI.Button backgroundColor='gray' onClick={() => {
              setIsOpen(false)
              setIsErasing(true)
            }}>
              <span>Erase</span>
            </UI.Button>

            <UI.Button backgroundColor='green' onClick={() => startTesting()}>
              <span>Run Test</span>
            </UI.Button>
          </aside>
        ))}

        {recording.routeIndex === routeIndex && recording.testIndex === index && (
          <aside style={{ opacity: 1 }}>
            <UI.Button backgroundColor='red' onClick={() => stopRecording()}>
              <span>Stop Recording</span>
            </UI.Button>
          </aside>
        )}

        {testing.routeIndex === routeIndex && testing.testIndex === index && (
          <aside>
            <UI.Button backgroundColor='red' onClick={() => stopTesting()}>
              <span>Stop Testing</span>
            </UI.Button>
          </aside>
        )}
      </footer>

      <UI.Button backgroundColor='red' onClick={() => {
        stopRecording()
        stopTesting()
        setIsOpen(false)
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
              updateTest({ index, updates: { recorded: [], state: `` } })
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
  opacity: ${({ test }) => test.skip ? 0.25 : 1};
  transition: opacity 0.25s ease-in-out;

  &&& > ${UI.Input} {
    margin-bottom: 0;

    > aside {
      position: absolute;
      top: 1px;
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

        > span {
          display: inline-block;
          font-size: 15px;
          margin-left: 29px;
          margin-bottom: 15px;
        }

        > div {
          position: relative;
          display: block;
          min-height: 30px;
          font-size: 15px;
          line-height: 20px;
          padding: 5px 80px 5px 47.5px;

          > span {
            display: inline-block;
            vertical-align: middle;

            &:first-child {
              position: absolute;
              left: 27px;
              top: 7.5px;
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

export default Test
