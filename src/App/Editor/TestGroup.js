import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import octicons from 'octicons'
import * as UI from '../../UI'
import Test from './Test'

import {
  IDLE,
  RECORDING,

  UNTESTED
} from '../../constants'

const TestGroup = styled(({ store, testGroupIndex, testGroup, ...props }) => {
  const [ isDeleting, setIsDeleting ] = React.useState(false)
  const [ isErasing, setIsErasing ] = React.useState(false)
  const [ isOpen, setIsOpen ] = React.useState(false)

  return (
    <section { ...props }>
      <div>
        <UI.Input
          placeholder='Test Group Description'
          value={testGroup.description}
          autoFocus={!testGroup.description}
          onKeyUp={event => {
            if (event.key === `Enter` || event.key === `Escape`) {
              event.target.blur()
              event.preventDefault()
              event.stopPropagation()
            }
          }}
          onBlur={event => {
            const description = event.target.value

            if (description !== testGroup.description) {
              store.updateTestGroup({ testGroupIndex, updates: { description } })
            }
          }}
        >
          <aside>
            <label>
              <input
                type='checkbox'
                checked={testGroup.skip}
                tabIndex={1}
                onChange={event => {
                  const skip = event.target.checked
                  store.updateTestGroup({ testGroupIndex, updates: { skip } })
                }}
              />

              <span>Skip</span>
            </label>
          </aside>
        </UI.Input>

        <UI.Input
          placeholder='Path'
          value={testGroup.path}
          onKeyUp={event => {
            if (event.key === `Enter` || event.key === `Escape`) {
              event.target.blur()
              event.preventDefault()
              event.stopPropagation()
            }
          }}
          onBlur={event => {
            const path = event.target.value

            if (path !== testGroup.path) {
              store.updateTestGroup({ testGroupIndex, updates: { path } })
            }
          }}
        >
          <aside>
            <label>
              <input
                type='checkbox'
                checked={testGroup.exact}
                onChange={event => {
                  const exact = event.target.checked
                  store.updateTestGroup({ testGroupIndex, updates: { exact } })
                }}
              />

              <span>Exact</span>
            </label>

            <label>
              <input
                type='checkbox'
                checked={testGroup.strict}
                onChange={event => {
                  const strict = event.target.checked
                  store.updateTestGroup({ testGroupIndex, updates: { strict } })
                }}
              />

              <span>Strict</span>
            </label>
          </aside>
        </UI.Input>

        {store.state === IDLE && (
          <UI.Button backgroundColor='red' onClick={() => setIsDeleting(true)}>
            <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 14, height: 14 }) }} />
          </UI.Button>
        )}
      </div>

      <footer>
        {!testGroup.tests.length ? (
          <details onToggle={event => event.stopPropagation()}>
            <summary>
              <span>
                0 tests
              </span>
            </summary>
          </details>
        ) : (
          <details open={isOpen} onToggle={event => {
            setIsOpen(event.target.open)
            event.stopPropagation()
          }}>
            <summary>
              {(store.state === IDLE || store.testGroupIndex !== testGroupIndex) && testGroup.state === UNTESTED && !testGroup.skip ? (
                <UI.Icon dangerouslySetInnerHTML={{
                  __html: octicons[isOpen ? `chevron-down` : `chevron-right`].toSVG({ width: 30, height: 30 })
                }} />
              ) : (
                <UI.StateIcon
                  store={store}
                  testGroupIndex={testGroupIndex}
                  testGroup={testGroup}
                />
              )}

              <span>
                {testGroup.tests.length} test{testGroup.tests.length === 1 ? `` : `s`}
              </span>
            </summary>

            <div>
              {testGroup.tests.map((test, testIndex) => (
                <Test
                  key={`Test_${testGroupIndex}_${testIndex}`}
                  store={store}
                  testGroupIndex={testGroupIndex}
                  testGroup={testGroup}
                  testIndex={testIndex}
                  test={test}
                />
              ))}

              <section>
                <UI.Button onClick={() => store.addTest({ testGroupIndex })}>
                  <span>Add Test</span>
                </UI.Button>
              </section>
            </div>
          </details>
        )}

        <aside>
          {store.state === IDLE && (
            <React.Fragment>
              {!testGroup.tests.length ? (
                <UI.Button onClick={() => {
                  setIsOpen(true)
                  store.addTest({ testGroupIndex })
                }}>
                  <span>Add Test</span>
                </UI.Button>
              ) : (
                <UI.Button backgroundColor='gray' onClick={() =>  setIsErasing(true)}>
                  <span>Erase</span>
                </UI.Button>
              )}

              {testGroup.tests.some(test => !test.skip && test.frames.length > 0) && (
                <UI.Button backgroundColor='green' onClick={() => store.startTesting({ testGroupIndex, allTests: true })}>
                  <span>Run Test Group</span>
                </UI.Button>
              )}
            </React.Fragment>
          )}
        </aside>
      </footer>

      {isDeleting && (
        <center>
          <div>
            <div>Delete this group of tests?</div>

            <UI.Button backgroundColor='gray' onClick={() => setIsDeleting(false)}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
              <span>Cancel</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsDeleting(false)
              store.deleteTestGroup({ testGroupIndex })
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
            <div>Erase all tests from this group?</div>

            <UI.Button backgroundColor='gray' onClick={() => setIsErasing(false)}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
              <span>Cancel</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsErasing(false)

              store.updateTestGroup({
                testGroupIndex,
                updates: {
                  state: UNTESTED,
                  tests: []
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
  box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.05);
  opacity: ${({ store, testGroupIndex, testGroup }) => (testGroup.skip || (store.state === RECORDING && store.testGroupIndex !== testGroupIndex)) ? 0.25 : 1 };
  transition: opacity 0.25s ease-in-out;

  &:hover {
    box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.1);
    opacity: 1;
  }

  > div {
    position: relative;

    > ${UI.Input} {
      width: 50%;

      > input {
        font-size: 20px;
      }

      > aside {
        position: absolute;
        top: 1px;
        left: 170px;
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

      + ${UI.Input} {
        > aside {
          left: 45px;
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

  > footer {
    position: relative;
    padding: 10px;
    background: ${({ theme }) => mix(0.5, theme.colors.background, `rgba(47, 47, 47, 1)`)};

    > details {
      > summary {
        font-size: 20px;
        line-height: 30px;
        cursor: ${({ testGroup }) => testGroup.tests.length ? `pointer` : `auto`};

        &::-webkit-details-marker {
          display: none;
        }

        > span {
          display: inline-block;
          vertical-align: top;

          &:only-child {
            margin-left: 10px;
          }
        }

        > ${UI.Icon} {
          margin-right: 2.5px;
          opacity: 0.5;
          transition: opacity 0.25s ease-in-out;
        }

        &:hover {
          > ${UI.Icon} {
            opacity: 1;
          }
        }

        > ${UI.StateIcon} {
          margin-right: 2.5px;
        }
      }

      > div {
        position: relative;
        margin: 30px 0;

        > span {
          display: inline-block;
          font-size: 15px;
          margin-left: 29px;
          margin-bottom: 15px;
        }

        > ${Test} {
          margin-bottom: 30px;
        }

        > section {
          &:last-of-type {
            margin-bottom: 30px;
            text-align: center;

            > ${UI.Button} {
              padding: 5px 30px;
              visibility: ${({ store }) => store.state === IDLE ? `visible` : `hidden`};
            }
          }
        }
      }
    }

    > aside {
      position: absolute;
      top: 10px;
      right: 10px;
      opacity: ${({ store, testGroupIndex, testGroup }) => ((store.state === IDLE && !testGroup.tests.length) || (store.state === RECORDING && store.testGroupIndex === testGroupIndex)) ? 1 : 0};
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
      margin-top: 15px;

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

export default TestGroup
