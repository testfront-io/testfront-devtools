import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import octicons from 'octicons'
import * as UI from '../../UI'
import EventSelection from './EventSelection'
import RecordedItem from './RecordedItem'
import actionableEventTypes from './actionableEventTypes'
import tab from '../../tab'

export const hasOneSelected = ({ eventTypesGroup, eventTypes }) => {
  for (let eventType of eventTypesGroup[1]) {
    if (eventTypes.includes(eventType)) {
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

export const Rotate = styled((props) => (
  <span { ...props } />
))`
  animation: rotate 2s linear infinite;

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
`

const Test = styled(({
  description,
  snapshotSelector,
  eventTypes,
  recorded,
  set,
  setData,
  routeIndex,
  testIndex,
  updateTest,
  deleteTest,
  isRecording,
  isTesting,
  autoFocus,
  ...props
}) => {
  const [ showingMore, setShowingMore ] = React.useState(false)
  const [ isDeleting, setIsDeleting ] = React.useState(false)
  const [ isErasing, setIsErasing ] = React.useState(false)
  const [ isOpen, setIsOpen ] = React.useState(false)

  const startRecording = () => {
    setIsOpen(true)
    set(store => ({ testIndex, isRecording: true, isTesting: false }))
    tab.sendMessage({ command: `startRecording`, snapshotSelector, eventTypes })
  }

  const stopRecording = () => {
    tab.sendMessage({ command: `stopRecording` })
  }

  const startTest = () => {
    set(store => ({ testIndex, isRecording: false, isTesting: true }))

    setData(data => {
      const routes = [ ...data.routes ]
      const tests = [ ...routes[routeIndex].tests ]
      const recorded = tests[testIndex].recorded.map(recordedItem => ({
        ...recordedItem,
        passed: undefined,
        error: undefined
      }))

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

    setIsOpen(true)
    setTimeout(() => tab.sendMessage({ command: `startTest`, snapshotSelector, recorded }), 10) // TODO find a better way?
  }

  const stopTest = () => {
    tab.sendMessage({ command: `stopTest` })
  }

  const updateRecorded = ({ recordedIndex, updates }) => {
    const recordedUpdates = [ ...recorded ]

    recordedUpdates[recordedIndex] = {
      ...recordedUpdates[recordedIndex],
      ...updates
    }

    updateTest({
      testIndex,
      updates: {
        recorded: recordedUpdates
      }
    })
  }

  const deleteRecorded = ({ recordedIndex }) => {
    const recordedUpdates = [ ...recorded ]

    recordedUpdates.splice(recordedIndex, 1)

    updateTest({
      testIndex,
      updates: {
        recorded: recordedUpdates
      }
    })
  }

  let testItemIndex = 0
  let passedCount = 0
  let failedCount = 0
  let snapshotCount = 0
  let eventCount = 0

  const getItemProps = ({ recordedItem, recordedIndex }) => {
    let color = `inherit`

    if (recordedItem.passed === true) {
      passedCount++
      testItemIndex++
      color = `green`
    } else if (recordedItem.passed === false) {
      failedCount++
      testItemIndex++
      color = `red`
    } else if (isTesting && testItemIndex === recordedIndex) {
      color = `yellow`
    }

    if (typeof recordedItem.html !== `undefined`) {
      snapshotCount++
    } else {
      eventCount++
    }

    return {
      ...recordedItem,
      recordedIndex,
      color
    }
  }

  const recordedItems = (
    <div>
      {recorded.length ? recorded.map((recordedItem, recordedIndex) => (
        <RecordedItem
          key={`recordedItem_${recordedIndex}`}
          updateRecorded={updateRecorded}
          deleteRecorded={deleteRecorded}
          { ...getItemProps({ recordedItem, recordedIndex }) }
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
        value={description || ``}
        onBlur={event => {
          if (event.target.value !== description) {
            updateTest({ testIndex, updates: { description: event.target.value } })
          }
        }}
        autoFocus={autoFocus}
      />

      <UI.Input
        width='40%'
        placeholder='Snapshot Container Selector'
        value={snapshotSelector || `html`}
        onBlur={event => {
          if (event.target.value !== snapshotSelector) {
            updateTest({ testIndex, updates: { snapshotSelector: event.target.value } })
          }
        }}
      />

      {recorded.length === 0 && (
        <React.Fragment>
          <header>Events to Record</header>

          {actionableEventTypes.map((eventTypesGroup, eventTypesGroupIndex) => (
            <EventSelection
              key={`EventSelection_${testIndex}_${eventTypesGroupIndex}`}
              style={(showingMore || (!eventTypes.length && eventTypesGroupIndex < 2) || hasOneSelected({ eventTypesGroup, eventTypes })) ? undefined : { display: `none` }}
              eventTypesGroup={eventTypesGroup}
              eventTypes={eventTypes}
              testIndex={testIndex}
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

      {isRecording && (
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
            <UI.Button backgroundColor='red' onClick={() => {
              stopRecording()
            }}>
              Stop
            </UI.Button>
          </aside>
        </footer>
      )}

      {isTesting && (
        <footer>
          <details open={isOpen} onToggle={({ target }) => setIsOpen(target.open)}>
            <Summary color='yellow'>
              <Rotate
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
            <UI.Button backgroundColor='red' onClick={() => {
              stopTest()
            }}>
              Stop
            </UI.Button>
          </aside>
        </footer>
      )}

      {!isRecording && !isTesting && (
        <footer>
          <details open={isOpen} onToggle={({ target }) => setIsOpen(target.open)}>
            <Summary color={(recorded.length > 0 && passedCount === recorded.length) ? `green` : (failedCount > 0 ? `red` : `inherit`)}>
              <span
                style={{ padding: 4 }}
                dangerouslySetInnerHTML={{
                  __html: octicons[(recorded.length > 0 && passedCount === recorded.length) ? `check` : (failedCount > 0 ? `x` : (isOpen ? `chevron-down` : `chevron-right`))].toSVG({ width: 22, height: 22 })
                }}
              />

              <span>
                {snapshotCount} Snapshot{snapshotCount === 1 ? `` : `s`}, {eventCount} Event{eventCount === 1 ? `` : `s`}
              </span>
            </Summary>

            {recordedItems}
          </details>

          {recorded.length > 0 ? (
            <aside>
              <UI.Button backgroundColor='red' onClick={() => {
                setIsErasing(true)
              }}>
                Erase
              </UI.Button>

              <UI.Button backgroundColor='green' onClick={() => {
                startTest()
              }}>
                Run Test
              </UI.Button>
            </aside>
          ) : (
            <aside>
              <UI.Button backgroundColor='green' onClick={() => {
                startRecording()
              }}>
                Record
              </UI.Button>
            </aside>
          )}
        </footer>
      )}

      <UI.Button backgroundColor='red' onClick={() => {
        if (isRecording) {
          stopRecording()
        }

        setIsDeleting(true)
      }}>
        <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 14, height: 14 }) }} />
      </UI.Button>

      {isDeleting && (
        <center>
          <div>
            <div>Delete this test?</div>

            <UI.Button backgroundColor='gray' onClick={() => {
              setIsDeleting(false)
            }}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
              <span>Cancel</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsDeleting(false)
              deleteTest({ testIndex })
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

            <UI.Button backgroundColor='gray' onClick={() => {
              setIsErasing(false)
            }}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
              <span>Cancel</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsErasing(false)
              updateTest({ testIndex, updates: { recorded: [] } })
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
  margin-bottom: 45px;
  box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.05);

  &&& > ${UI.Input} {
    margin-bottom: 0;
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
