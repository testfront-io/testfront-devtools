import React from 'react'
import styled from 'styled-components'

const EventSelection = styled(({ store, testGroupIndex, testIndex, eventTypes, eventTypesGroup, eventTypesGroupIndex, ...props }) => {
  const checkedNone = !eventTypesGroup[1].filter(eventType => eventTypes.includes(eventType)).length

  return (
    <details onToggle={event => event.stopPropagation()} { ...props }>
      <summary>
        <span>{eventTypesGroup[0]}</span>

        <input
          type='checkbox'
          checked={!checkedNone}
          onChange={event => {
            if (checkedNone) {
              store.updateTest({
                testGroupIndex,
                testIndex,
                updates: {
                  eventTypes: eventTypes.concat(eventTypesGroup[1])
                }
              })
            } else {
              store.updateTest({
                testGroupIndex,
                testIndex,
                updates: {
                  eventTypes: eventTypes.filter(
                    eventType => !eventTypesGroup[1].includes(eventType)
                  )
                }
              })
            }
          }}
        />
      </summary>

      {eventTypesGroup[1].map(eventType => (
        <label key={`eventType_${eventType}`}>
          <span>{eventType}</span>

          <input
            type='checkbox'
            checked={eventTypes.includes(eventType)}
            onChange={event => {
              const eventTypeIndex = eventTypes.indexOf(eventType)

              if (event.target.checked) {
                if (eventTypeIndex < 0) {
                  eventTypes = [ ...eventTypes, eventType ]
                }
              } else if (eventTypeIndex > -1) {
                eventTypes = [ ...eventTypes ]
                eventTypes.splice(eventTypeIndex, 1)
              }

              store.updateTest({
                testGroupIndex,
                testIndex,
                updates: {
                  eventTypes
                }
              })
            }}
          />
        </label>
      ))}
    </details>
  )
})`
  position: relative;
  padding: 2.5px 0 2.5px 15px;
  font-size: 15px;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.25);
  }

  > summary {
    padding: 2.5px 0;

    > span {
      margin-left: 5px;
    }

    > input {
      position: absolute;
      top: 7.5px;
      right: 15px;
      margin: 0;
    }
  }

  > label {
    position: relative;
    display: block;
    padding: 2.5px 0 2.5px 15px;
    margin-left: 20px;
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, 0.5);
    }

    > input {
      position: absolute;
      top: 50%;
      right: 15px;
      margin: 0;
      transform: translateY(-50%);
    }
  }
`

export default EventSelection
