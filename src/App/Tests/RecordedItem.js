import React from 'react'
import styled from 'styled-components'
import octicons from 'octicons'
import * as UI from '../../UI'
import * as utilities from '../utilities'

const RecordedItem = styled(({
  recording,
  testing,
  routeIndex,
  testIndex,
  index,
  recordedItem,
  updateRecordedItem,
  deleteRecordedItem,
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
      <div>{`Delete ${typeof recordedItem.html !== `undefined` ? `snapshot` : `event`} from sequence?`}</div>

      <UI.Button backgroundColor='gray' onClick={() => {
        setIsDeleting(false)
      }}>
        <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
        <span>Cancel</span>
      </UI.Button>

      <UI.Button backgroundColor='red' onClick={() => {
        setIsDeleting(false)
        deleteRecordedItem({ index })
      }}>
        <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
        <span>Delete</span>
      </UI.Button>
    </aside>
  )

  return typeof recordedItem.html !== `undefined` ? (
    <div { ...props } style={{ backgroundColor: `#3c3c3c` }}>
      <UI.StateIcon
        recording={recording}
        testing={testing}
        routeIndex={routeIndex}
        testIndex={testIndex}
        recordedItemIndex={index}
        state={recordedItem.state}
        iconKey='device-camera'
      />

      <span>Snapshot</span>

      {recordedItem.error && recordedItem.error.html && (
        <div><pre dangerouslySetInnerHTML={{ __html: utilities.getPrettyHtml(utilities.getDiffs(recordedItem.html, recordedItem.error.html)) }} /></div>
      )}

      {isDeleting ? deleteConfirmation : (
        <aside>
          {deleteButton}
        </aside>
      )}
    </div>
  ) : (
    <div { ...props }>
      <UI.StateIcon
        recording={recording}
        testing={testing}
        routeIndex={routeIndex}
        testIndex={testIndex}
        recordedItemIndex={index}
        state={recordedItem.state}
        iconKey='circuit-board'
      />

      {editing ? (
        <React.Fragment>
          <UI.Input
            width={typeof recordedItem.value !== `undefined` ? `50%` : `100%`}
            placeholder={`${recordedItem.eventType[0].toUpperCase() + recordedItem.eventType.slice(1)} Target Selector`}
            value={recordedItem.targetSelector}
            autoFocus={editing === `targetSelector`}
            onBlur={event => {
              if (event.target.value !== recordedItem.targetSelector) {
                updateRecordedItem({ index, updates: { targetSelector: event.target.value } })
              }
            }}
            onKeyUp={event => {
              if (event.key === `Escape`) {
                setEditing(``)
                event.preventDefault()
                event.stopPropagation()
              } else if (event.key === `Enter`) {
                if (event.target.value !== recordedItem.targetSelector) {
                  updateRecordedItem({ index, updates: { targetSelector: event.target.value } })
                }

                setEditing(``)
                event.preventDefault()
                event.stopPropagation()
              }
            }}
          />

          {typeof recordedItem.value !== `undefined` && (
            <UI.Input
              width='50%'
              placeholder='Value'
              value={recordedItem.value}
              autoFocus={editing === `value`}
              onBlur={event => {
                if (event.target.value !== recordedItem.value) {
                  updateRecordedItem({ index, updates: { value: event.target.value } })
                }
              }}
              onKeyUp={event => {
                if (event.key === `Escape`) {
                  setEditing(``)
                  event.preventDefault()
                  event.stopPropagation()
                } else if (event.key === `Enter`) {
                  if (event.target.value !== recordedItem.targetSelector) {
                    updateRecordedItem({ index, updates: { value: event.target.value } })
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
            {recordedItem.eventType[0].toUpperCase() + recordedItem.eventType.slice(1)} <pre onClick={() => setEditing(`targetSelector`)}>{recordedItem.targetSelector.split(` > `).pop()}</pre>

            {typeof recordedItem.value !== `undefined` && (
              <React.Fragment>
                {` value to '`}
                <span onClick={() => setEditing(`value`)}>{recordedItem.value}</span>
                {`'`}
              </React.Fragment>
            )}
          </span>

          {recordedItem.error && recordedItem.error.message && (
            <div>
              <span>{recordedItem.error.message}</span>
            </div>
          )}
        </React.Fragment>
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
  min-height: 30px;
  padding: 5px 80px 5px 47.5px;
  background: #343434;
  font-size: 15px;
  line-height: 20px;

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

export default RecordedItem
