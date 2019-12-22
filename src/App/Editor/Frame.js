import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import octicons from 'octicons'
import * as UI from '../../UI'
import * as utilities from '../utilities'

import {
  IDLE
} from '../../constants'

const Frame = styled(({ store, testGroupIndex, testGroup, testIndex, test, frameIndex, frame, ...props }) => {
  const [ editing, setEditing ] = React.useState(``)
  const [ isDeleting, setIsDeleting ] = React.useState(false)

  const deleteButton = (
    <UI.Button backgroundColor='red' onClick={() => {
      setEditing(``)
      setIsDeleting(true)
    }}>
      <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
    </UI.Button>
  )

  const deleteConfirmation = (
    <aside style={{ opacity: 1 }}>
      <div>{`Delete ${typeof frame.html !== `undefined` ? `snapshot` : `event`} from sequence?`}</div>

      <UI.Button backgroundColor='gray' onClick={() => {
        setIsDeleting(false)
      }}>
        <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
        <span>Cancel</span>
      </UI.Button>

      <UI.Button backgroundColor='red' onClick={() => {
        setIsDeleting(false)
        store.deleteFrame({ testGroupIndex, testIndex, frameIndex })
      }}>
        <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
        <span>Delete</span>
      </UI.Button>
    </aside>
  )

  return typeof frame.html !== `undefined` ? (
    <div { ...props }>
      <UI.StateIcon
        store={store}
        testGroupIndex={testGroupIndex}
        testGroup={testGroup}
        testIndex={testIndex}
        test={test}
        frameIndex={frameIndex}
        frame={frame}
        iconKey={`device-camera`}
        width={15}
        height={15}
      />

      <span>Snapshot</span>

      {frame.error && frame.error.html && (
        <div>
          <pre dangerouslySetInnerHTML={{
            __html: utilities.getPrettyHtml(utilities.getDiffs(frame.html, frame.error.html))
          }} />
        </div>
      )}

      {store.state === IDLE && (isDeleting ? deleteConfirmation : (
        <aside>
          {deleteButton}
        </aside>
      ))}
    </div>
  ) : (
    <div { ...props }>
      <UI.StateIcon
        store={store}
        testGroupIndex={testGroupIndex}
        testGroup={testGroup}
        testIndex={testIndex}
        test={test}
        frameIndex={frameIndex}
        frame={frame}
        iconKey={`circuit-board`}
        width={15}
        height={15}
      />

      {editing ? (
        <React.Fragment>
          <UI.Input
            width={typeof frame.value !== `undefined` ? `50%` : `100%`}
            placeholder={`${frame.eventType[0].toUpperCase() + frame.eventType.slice(1)} Target Selector`}
            value={frame.targetSelector}
            autoFocus={editing === `targetSelector`}
            onBlur={event => {
              const targetSelector = event.target.value

              if (targetSelector !== frame.targetSelector) {
                store.updateFrame({
                  testGroupIndex,
                  testIndex,
                  frameIndex,
                  updates: {
                    targetSelector
                  }
                })
              }
            }}
            onKeyUp={event => {
              if (event.key === `Escape`) {
                setEditing(``)
                event.preventDefault()
                event.stopPropagation()
              } else if (event.key === `Enter`) {
                const targetSelector = event.target.value

                if (targetSelector !== frame.targetSelector) {
                  store.updateFrame({
                    testGroupIndex,
                    testIndex,
                    frameIndex,
                    updates: {
                      targetSelector
                    }
                  })
                }

                setEditing(``)
                event.preventDefault()
                event.stopPropagation()
              }
            }}
          />

          {typeof frame.value !== `undefined` && (
            <UI.Input
              width='50%'
              placeholder='Value'
              value={frame.value}
              autoFocus={editing === `value`}
              onBlur={event => {
                const value = event.target.value

                if (value !== frame.targetSelector) {
                  store.updateFrame({
                    testGroupIndex,
                    testIndex,
                    frameIndex,
                    updates: {
                      value
                    }
                  })
                }
              }}
              onKeyUp={event => {
                if (event.key === `Escape`) {
                  setEditing(``)
                  event.preventDefault()
                  event.stopPropagation()
                } else if (event.key === `Enter`) {
                  const value = event.target.value

                  if (value !== frame.targetSelector) {
                    store.updateFrame({
                      testGroupIndex,
                      testIndex,
                      frameIndex,
                      updates: {
                        value
                      }
                    })
                  }

                  setEditing(``)
                  event.preventDefault()
                  event.stopPropagation()
                }
              }}
            />
          )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <span>
            {frame.eventType[0].toUpperCase() + frame.eventType.slice(1)} <pre onClick={() => setEditing(`targetSelector`)}>{frame.targetSelector.split(` > `).pop()}</pre>

            {typeof frame.value !== `undefined` && (
              <React.Fragment>
                {` value to '`}
                <span onClick={() => setEditing(`value`)}>{frame.value}</span>
                {`'`}
              </React.Fragment>
            )}
          </span>

          {frame.error && frame.error.message && (
            <div>
              <span>{frame.error.message}</span>
            </div>
          )}
        </React.Fragment>
      )}

      {store.state === IDLE && (isDeleting ? deleteConfirmation : (
        <aside>
          {editing ? (
            <UI.Button backgroundColor='green' onClick={() => setEditing(``)}>
              <span>Done</span>
            </UI.Button>
          ) : (
            <UI.Button onClick={() => setEditing(true)}>
              <span>Edit</span>
            </UI.Button>
          )}

          {deleteButton}
        </aside>
      ))}
    </div>
  )
})`
  position: relative;
  display: block;
  min-height: 30px;
  padding: 5px 80px 5px 50px;
  background: ${({ theme, frame }) => frame.html ? mix(0.5, theme.colors.background, `rgba(111, 111, 111, 1)`) : `inherit`};
  font-size: 15px;
  line-height: 20px;

  > span {
    display: inline-block;
    vertical-align: middle;

    > pre,
    > span {
      display: inline-block;
      vertical-align: middle;
      margin: 0;

      &:hover {
        background-color: rgba(0, 0, 0, 0.25);
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }

  > ${UI.StateIcon} {
    position: absolute;
    left: 27px;
    top: 7.5px;
    width: 15px;
    height: 15px;
  }

  > div {
    > span {
      display: inline-block;
      margin: 2.5px 0 5px;
      padding: 2.5px 5px;
      background-color: rgba(0, 0, 0, 0.25);
      color: ${({ theme }) => theme.colors.red || `rgba(255, 63, 63, 0.9)`};
      text-transform: uppercase;
      line-height: 1;
    }

    > pre {
      display: inline-block;
      margin: 5px 0;
      padding: 5px;
      white-space: pre-wrap;
      background-color: rgba(0, 0, 0, 0.25);
      color: rgba(255, 255, 255, 0.9);

      del {
        padding: 2.5px 0;
        background-color: ${({ theme }) => theme.colors.red || `red`};
        color: white;
        text-decoration-color: rgba(255, 255, 255, 0.75);
      }

      ins {
        padding: 2.5px 0;
        background-color: ${({ theme }) => theme.colors.green || `green`};
        color: white;
        text-decoration: none;
      }
    }
  }

  > ${UI.Input} {
    margin: -5px 0 -4px;

    > input {
      height: 30px;
      font-size: 13px;
      padding: 14px 3px 3px;
    }
  }

  > aside {
    position: absolute;
    top: 5px;
    right: 0;
    background: inherit;
    opacity: 0;
    transition: opacity 0.25s ease-in-out;

    > div {
      display: inline-block;
      vertical-align: middle;
      padding-left: 5px;
    }

    > ${UI.Button} {
      vertical-align: top;
      height: 20px;
      padding: 0 3px;
      margin-left: 5px;
      line-height: 15px;
      font-size: 15px;

      > span {
        height: 15px;

        ~ span {
          margin-left: 2px;
        }
      }
    }
  }

  &:hover {
    > aside {
      opacity: 1;
    }
  }
`

export default Frame