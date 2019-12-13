import React from 'react'
import styled from 'styled-components'
import octicons from 'octicons'
import * as UI from '../../UI'

const RecordedItem = styled(({
  html,
  eventType,
  targetSelector,
  value,
  passed,
  error,
  color,
  updateRecorded,
  deleteRecorded,
  recordedIndex,
  ...props
}) => {
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
      <div>{`Delete ${typeof html !== `undefined` ? `snapshot` : `event`}?`}</div>

      <UI.Button backgroundColor='gray' onClick={() => {
        setIsDeleting(false)
      }}>
        <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
        <span>Cancel</span>
      </UI.Button>

      <UI.Button backgroundColor='red' onClick={() => {
        setIsDeleting(false)
        deleteRecorded({ recordedIndex })
      }}>
        <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
        <span>Delete</span>
      </UI.Button>
    </aside>
  )

  return typeof html !== `undefined` ? (
    <div { ...props } style={{ backgroundColor: `rgba(127, 127, 127, 0.1)` }}>
      <span dangerouslySetInnerHTML={{ __html: octicons[passed === true ? `check` : (passed === false ? `x` : `device-camera`)].toSVG({ width: 15, height: 15 }) }} />

      <span>Snapshot</span>

      {isDeleting ? deleteConfirmation : (
        <aside>
          {deleteButton}
        </aside>
      )}
    </div>
  ) : (
    <div { ...props }>
      <span dangerouslySetInnerHTML={{ __html: octicons[passed === true ? `check` : (passed === false ? `x` : `circuit-board`)].toSVG({ width: 15, height: 15 }) }} />

      {editing ? (
        <React.Fragment>
          <UI.Input
            placeholder={`${eventType[0].toUpperCase() + eventType.slice(1)} Target Selector`}
            value={targetSelector}
            onBlur={event => {
              if (event.target.value !== targetSelector) {
                updateRecorded({ recordedIndex, updates: { eventType, targetSelector: event.target.value } })
              }
            }}
            onKeyUp={event => {
              if (event.key === `Escape`) {
                setEditing(``)
                event.preventDefault()
                event.stopPropagation()
              } else if (event.key === `Enter`) {
                if (event.target.value !== targetSelector) {
                  updateRecorded({ recordedIndex, updates: { eventType, targetSelector: event.target.value } })
                }

                setEditing(``)
                event.preventDefault()
                event.stopPropagation()
              }
            }}
            autoFocus={editing === `targetSelector`}
            style={typeof value !== `undefined` ? { width: `50%` } : {}}
          />

          {typeof value !== `undefined` && (
            <UI.Input
              placeholder='Value'
              value={value}
              onBlur={event => {
                if (event.target.value !== value) {
                  updateRecorded({ recordedIndex, updates: { eventType, targetSelector, value: event.target.value } })
                }
              }}
              onKeyUp={event => {
                if (event.key === `Escape`) {
                  setEditing(``)
                  event.preventDefault()
                  event.stopPropagation()
                } else if (event.key === `Enter`) {
                  if (event.target.value !== targetSelector) {
                    updateRecorded({ recordedIndex, updates: { eventType, targetSelector, value: event.target.value } })
                  }

                  setEditing(``)
                  event.preventDefault()
                  event.stopPropagation()
                }
              }}
              autoFocus={editing === `value`}
              style={{ width: `50%` }}
            />
          )}
        </React.Fragment>
      ) : (
        <span>
          {eventType[0].toUpperCase() + eventType.slice(1)} <pre onClick={() => setEditing(`targetSelector`)}>&lt;{targetSelector.split(` > `).pop().split(`:`).shift()}&gt;</pre>

          {typeof value !== `undefined` && (
            <React.Fragment>
              {` value to '`}
              <span onClick={() => setEditing(`value`)}>{value}</span>
              {`'`}
            </React.Fragment>
          )}
        </span>
      )}

      {isDeleting ? deleteConfirmation : (
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
      )}
    </div>
  )
})`
  position: relative;
  display: block;
  height: 30px;
  padding: 5px 80px 5px 50px;
  font-size: 15px;
  line-height: 20px;

  > span {
    display: inline-block;
    vertical-align: middle;

    &:first-child {
      position: absolute;
      left: 30px;
      top: 7.5px;
      color: ${({ color, theme }) => theme.colors[color] || color || `inherit`};
    }

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

  > ${UI.Input} {
    position: relative;
    top: -5px;
    margin: 0;

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
    opacity: 0;
    transition: opacity 0.25s ease-in-out;

    > div {
      display:inline-block;
      vertical-align: middle;
    }

    > ${UI.Button} {
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

export default RecordedItem
