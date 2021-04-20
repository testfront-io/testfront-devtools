import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import octicons from 'octicons'
import * as UI from '../../UI'
import EventSelection from './EventSelection'
import SnapshotFilter from './SnapshotFilter'
import Frame from './Frame'
import actionableEventTypes from './actionableEventTypes'

import {
  IDLE,
  RECORDING,

  UNTESTED
} from '../../constants'

export const hasOneSelected = ({ eventTypesGroup, test }) => {
  for (let eventType of eventTypesGroup[1]) {
    if (test.eventTypes.includes(eventType)) {
      return true
    }
  }

  return false
}

const Test = styled(({ store, testGroupIndex, testGroup, testIndex, test, ...props }) => {
  const [ showingMore, setShowingMore ] = React.useState(false)
  const [ isDeleting, setIsDeleting ] = React.useState(false)
  const [ isErasing, setIsErasing ] = React.useState(false)

  const [ detailsOpen, setDetailsOpen ] = React.useState({
    eventSelection: !test.frames.length,
    snapshotFilters: !test.frames.length,
    footer: false
  })

  const updateDetailsOpen = updates => setDetailsOpen({
    ...detailsOpen,
    ...updates
  })


  let snapshotCount = 0
  let eventCount = 0
  const frames = test.frames.map((frame, frameIndex) => {
    if (typeof frame.html !== `undefined`) {
      snapshotCount++
    } else {
      eventCount++
    }

    return (
      <Frame
        key={`frame_${testGroupIndex}_${testIndex}_${frameIndex}`}
        store={store}
        testGroupIndex={testGroupIndex}
        testGroup={testGroup}
        testIndex={testIndex}
        test={test}
        frameIndex={frameIndex}
        frame={frame}
      />
    )
  })

  return (
    <section { ...props }>
      <div>
        <UI.Input
          placeholder='Test Description'
          value={test.description || ``}
          autoFocus={!test.description}
          onKeyUp={event => {
            if (event.key === `Enter` || event.key === `Escape`) {
              event.target.blur()
              event.preventDefault()
              event.stopPropagation()
            }
          }}
          onBlur={event => {
            if (event.target.value !== test.description) {
              store.updateTest({
                testGroupIndex,
                testIndex,
                updates: {
                  description: event.target.value
                }
              })
            }
          }}
        >
          <aside>
            <label>
              <input
                type='checkbox'
                checked={test.skip}
                tabIndex={1}
                onChange={event => {
                  const skip = event.target.checked

                  store.updateTest({
                    testGroupIndex,
                    testIndex,
                    updates: {
                      skip
                    }
                  })
                }}
              />

              <span>Skip</span>
            </label>
          </aside>
        </UI.Input>

        <UI.Input
          placeholder='Snapshot Selector'
          value={test.snapshotSelector || ``}
          onKeyUp={event => {
            if (event.key === `Enter` || event.key === `Escape`) {
              event.target.blur()
              event.preventDefault()
              event.stopPropagation()
            }
          }}
          onBlur={event => {
            if (event.target.value !== test.snapshotSelector) {
              // TODO warn that recorded frames will be erased?
              store.updateTest({
                testGroupIndex,
                testIndex,
                updates: {
                  snapshotSelector: event.target.value,
                  frames: [],
                  state: UNTESTED
                }
              })
            }
          }}
        />

        {store.state === IDLE && (
          <UI.Button backgroundColor='red' onClick={() => setIsDeleting(true)}>
            <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 14, height: 14 }) }} />
          </UI.Button>
        )}
      </div>

      <details open={store.state === IDLE && detailsOpen.eventSelection} onToggle={event => {
        updateDetailsOpen({ eventSelection: event.target.open })
        event.stopPropagation()
      }}>
        <summary>{test.eventTypes.length} Event{test.eventTypes.length === 1 ? `` : `s`} to Record</summary>

        {actionableEventTypes.map((eventTypesGroup, eventTypesGroupIndex) => (
          <EventSelection
            key={`EventSelection_${testGroupIndex}_${testIndex}_${eventTypesGroupIndex}`}
            style={(showingMore || (!test.eventTypes.length && eventTypesGroupIndex < 3) || hasOneSelected({ eventTypesGroup, test })) ? undefined : { display: `none` }}
            store={store}
            testGroupIndex={testGroupIndex}
            testIndex={testIndex}
            eventTypes={test.eventTypes}
            eventTypesGroup={eventTypesGroup}
            eventTypesGroupIndex={eventTypesGroupIndex}
          />
        ))}

        {showingMore ? (
          <div onClick={() => setShowingMore(false)}>
            Show Less...
          </div>
        ) : (
          <div onClick={() => setShowingMore(true)}>
            Show More...
          </div>
        )}
      </details>

      <details open={store.state === IDLE && detailsOpen.snapshotFilters} onToggle={event => {
        updateDetailsOpen({ snapshotFilters: event.target.open })
        event.stopPropagation()
      }}>
        <summary>{test.snapshotFilters.length} Snapshot Filter{test.snapshotFilters.length === 1 ? `` : `s`}</summary>

        {test.snapshotFilters.map((snapshotFilter, snapshotFilterIndex) => (
          <SnapshotFilter
            key={`SnapshotFilter_${testGroupIndex}_${testIndex}_${snapshotFilterIndex}`}
            store={store}
            testGroupIndex={testGroupIndex}
            testIndex={testIndex}
            snapshotFilterIndex={snapshotFilterIndex}
            snapshotFilter={snapshotFilter}
          />
        ))}

        <center>
          <UI.Button onClick={() => store.addTestSnapshotFilter({ testGroupIndex, testIndex })}>
            <span>Add Filter</span>
          </UI.Button>
        </center>
      </details>

      <footer>
        {!test.frames.length ? (
          <details onToggle={event => event.stopPropagation()}>
            <summary>
              <span>
                Nothing recorded.
              </span>
            </summary>
          </details>
        ) : (
          <details open={detailsOpen.footer} onToggle={event => {
            updateDetailsOpen({ footer: event.target.open })
            event.stopPropagation()
          }}>
            <summary>
              {(store.state === IDLE || store.testGroupIndex !== testGroupIndex || store.testIndex !== testIndex) && test.state === UNTESTED && !test.skip ? (
                <UI.Icon style={{ padding: 4 }} dangerouslySetInnerHTML={{
                  __html: octicons[detailsOpen.footer ? `chevron-down` : `chevron-right`].toSVG({ width: 22, height: 22 })
                }} />
              ) : (
                <UI.StateIcon
                  store={store}
                  testGroupIndex={testGroupIndex}
                  testGroup={testGroup}
                  testIndex={testIndex}
                  test={test}
                  width={22}
                  height={22}
                />
              )}

              <span>
                {snapshotCount} snapshot{snapshotCount === 1 ? `` : `s`}, {eventCount} event{eventCount === 1 ? `` : `s`}
              </span>
            </summary>

            <div>
              {frames}
            </div>
          </details>
        )}

        <aside>
          {store.state === IDLE && (!test.frames.length ? (
            <UI.Button backgroundColor='green' onClick={() => {
              updateDetailsOpen({ footer: true })
              store.startRecording({ testGroupIndex, testIndex })
            }}>
              <span>Record</span>
            </UI.Button>
          ) : (
            <React.Fragment>
              <UI.Button backgroundColor='gray' onClick={() => setIsErasing(true)}>
                <span>Erase</span>
              </UI.Button>

              <UI.Button backgroundColor='green' onClick={() => {
                updateDetailsOpen({ footer: true })
                store.startTesting({ testGroupIndex, testIndex })
              }}>
                <span>Run Test</span>
              </UI.Button>
            </React.Fragment>
          ))}
        </aside>
      </footer>

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
              store.deleteTest({ testGroupIndex, testIndex })
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
              updateDetailsOpen({ eventSelection: true, snapshotFilters: true })
              setIsErasing(false)

              store.updateTest({
                testGroupIndex,
                testIndex,
                updates: {
                  state: UNTESTED,
                  frames: []
                }
              })
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
  background: ${({ theme }) => mix(0.5, theme.colors.background, `rgba(63, 63, 63, 1)`)};
  box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.05);
  opacity: ${({ store, testGroupIndex, testIndex, test }) => (test.skip || (store.state === RECORDING && (store.testGroupIndex !== testGroupIndex || store.testIndex !== testIndex))) ? 0.25 : 1 };
  transition: opacity 0.25s ease-in-out;

  &:hover {
    box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.1);
    opacity: 1;
  }

  > div {
    position: relative;
    background: ${({ theme }) => mix(0.5, theme.colors.background, `rgba(47, 47, 47, 1)`)};

    > ${UI.Input} {
      width: calc(50% - 2.5px);
      margin-right: 2.5px;

      ~ ${UI.Input} {
        margin-left: 2.5px;
        margin-right: 0;
      }

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
            transition: opacity 0.25s ease-in-out;

            &:checked + span {
              color: rgba(255, 255, 255, 0.9);
            }

            &[type='checkbox']:not(:checked) {
              opacity: 0.5;
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
  }

  &:hover {
    > div {
      > ${UI.Button} {
        opacity: 0.75;

        &:hover {
          opacity: 1;
        }
      }
    }
  }

  > details {
    display: inline-block;
    vertical-align: top;
    width: calc(50% - 2.5px);
    padding: 10px 0;
    margin-right: 2.5px;

    ~ details {
      margin-left: 2.5px;
      margin-right: 0;
    }

    > summary {
      padding: 3px 5px;
      font-size: 11px;
      line-height: 1;
      color: gray;
      text-transform: uppercase;
      cursor: pointer;
      transition: color 0.25s ease-in-out;
    }

    &[open] {
      > summary {
        margin-bottom: 5px;
      }
    }

    &:hover {
      > summary {
        color: inherit;
      }
    }

    > div {
      &:last-child {
        padding: 6px 0 6px 37px;
        font-size: 13px;
        line-height: 1;
        color: gray;
        cursor: pointer;

        &:hover {
          background: rgba(0, 0, 0, 0.25);
          color: inherit;
          text-decoration: underline;
        }
      }
    }

    > center {
      margin: 10px 0;

      > ${UI.Button} {
        height: 25px;
        font-size: 15px;
        line-height: 1;
      }
    }
  }

  > footer {
    position: relative;
    padding: 5px;
    background: ${({ theme }) => mix(0.5, theme.colors.background, `rgba(95, 95, 95, 1)`)};

    > details {
      > summary {
        font-size: 18px;
        line-height: 30px;
        cursor: ${({ test }) => test.frames.length ? `pointer` : `auto`};

        &::-webkit-details-marker {
          display: none;
        }

        > span {
          display: inline-block;
          vertical-align: top;

          &:only-child {
            margin-left: 7.5px;
          }
        }

        > ${UI.Icon} {
          opacity: 0.5;
          transition: opacity 0.25s ease-in-out;
        }

        &:hover {
          > ${UI.Icon} {
            opacity: 1;
          }
        }

        > ${UI.StateIcon} {
          padding: 4px;
        }
      }

      > div {
        position: relative;
        margin: 5px 0;

        > span {
          display: inline-block;
          font-size: 15px;
          margin-left: 29px;
          margin-bottom: 15px;
        }
      }
    }

    > aside {
      position: absolute;
      top: 5px;
      right: 5px;
      opacity: ${({ store, testGroupIndex, testIndex, test }) => ((store.state === IDLE && !test.frames.length) || (store.state === RECORDING && store.testGroupIndex === testGroupIndex && store.testIndex === testIndex)) ? 1 : 0};
      transition: opacity 0.25s ease-in-out;

      > ${UI.Button} {
        ~ ${UI.Button} {
          margin-left: 5px;
        }
      }
    }
  }

  &:hover {
    > footer {
      > aside {
        opacity: 1;
      }
    }
  }

  > center {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    font-size: 18px;
    background: ${({ theme }) => theme.colors.background};
    border: 1px solid ${({ theme }) => theme.colors.red || `red`};

    > div {
      margin-top: ${({ test }) => test.frames.length ? `10px` : `60px`};

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
`

export default Test
