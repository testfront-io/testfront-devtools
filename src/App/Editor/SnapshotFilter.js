import React from 'react'
import styled from 'styled-components'
import octicons from 'octicons'
import * as UI from '../../UI'

import {
  IDLE
} from '../../constants'

const SnapshotFilter = styled(({ store, testGroupIndex, testIndex, snapshotFilterIndex, snapshotFilter, ...props }) => {
  const isGlobal = typeof testGroupIndex === `undefined` && typeof testIndex === `undefined`
  const [ isDeleting, setIsDeleting ] = React.useState(false)

  if (isDeleting) {
    return (
      <div { ...props }>
        {store.state === IDLE && (
          <aside style={{ opacity: 1 }}>
            <div>Delete filter?</div>

            <UI.Button backgroundColor='gray' onClick={() => setIsDeleting(false)}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
              <span>Cancel</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsDeleting(false)

              if (isGlobal) {
                store.deleteSnapshotFilter({ snapshotFilterIndex })
              } else {
                store.deleteTestSnapshotFilter({ testGroupIndex, testIndex, snapshotFilterIndex })
              }
            }}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
              <span>Delete</span>
            </UI.Button>
          </aside>
        )}
      </div>
    )
  }

  let editor = null

  switch (snapshotFilter.type) {
    default:
      editor = (
        <UI.Select
          value=''
          onChange={event => {
            const type = event.target.value

            if (type) {
              if (isGlobal) {
                store.updateSnapshotFilter({
                  snapshotFilterIndex,
                  updates: {
                    type,
                    values: (
                      type === `removeElements` && {
                        elementsSelector: ``
                      }
                    ) || (
                      type === `removeAttribute` && {
                        attribute: ``,
                        elementsSelector: `*`
                      }
                    ) || {}
                  }
                })
              } else {
                store.updateTestSnapshotFilter({
                  testGroupIndex,
                  testIndex,
                  snapshotFilterIndex,
                  updates: {
                    type,
                    values: (
                      type === `removeElements` && {
                        elementsSelector: ``
                      }
                    ) || (
                      type === `removeAttribute` && {
                        attribute: ``,
                        elementsSelector: `*`
                      }
                    ) || {}
                  }
                })
              }
            }
          }}
        >
          <option value=''>Choose Filter Type...</option>
          <option value='removeElements'>Remove Elements</option>
          <option value='removeAttribute'>Remove Attribute</option>
        </UI.Select>
      )
    break

    case `removeElements`:
      editor = (
        <UI.Input
          width='100%'
          placeholder='Remove Elements (Selector)'
          value={snapshotFilter.values.elementsSelector}
          autoFocus={!snapshotFilter.values.elementsSelector}
          onBlur={event => {
            const elementsSelector = event.target.value

            if (elementsSelector !== snapshotFilter.values.elementsSelector) {
              if (isGlobal) {
                store.updateSnapshotFilter({
                  snapshotFilterIndex,
                  updates: {
                    values: {
                      ...snapshotFilter.values,
                      elementsSelector
                    }
                  }
                })
              } else {
                store.updateTestSnapshotFilter({
                  testGroupIndex,
                  testIndex,
                  snapshotFilterIndex,
                  updates: {
                    values: {
                      ...snapshotFilter.values,
                      elementsSelector
                    }
                  }
                })
              }
            }
          }}
        />
      )
    break

    case `removeAttribute`:
      editor = (
        <React.Fragment>
          <UI.Input
            width='50%'
            placeholder='Remove Attribute'
            value={snapshotFilter.values.attribute}
            autoFocus={!snapshotFilter.values.attribute}
            onBlur={event => {
              const attribute = event.target.value

              if (attribute !== snapshotFilter.values.attribute) {
                if (isGlobal) {
                  store.updateSnapshotFilter({
                    snapshotFilterIndex,
                    updates: {
                      values: {
                        ...snapshotFilter.values,
                        attribute
                      }
                    }
                  })
                } else {
                  store.updateTestSnapshotFilter({
                    testGroupIndex,
                    testIndex,
                    snapshotFilterIndex,
                    updates: {
                      values: {
                        ...snapshotFilter.values,
                        attribute
                      }
                    }
                  })
                }
              }
            }}
          />

          <UI.Input
            width='50%'
            placeholder='From (Selector)'
            value={snapshotFilter.values.elementsSelector}
            onBlur={event => {
              const elementsSelector = event.target.value

              if (elementsSelector !== snapshotFilter.values.elementsSelector) {
                if (isGlobal) {
                  store.updateSnapshotFilter({
                    snapshotFilterIndex,
                    updates: {
                      values: {
                        ...snapshotFilter.values,
                        elementsSelector
                      }
                    }
                  })
                } else {
                  store.updateTestSnapshotFilter({
                    testGroupIndex,
                    testIndex,
                    snapshotFilterIndex,
                    updates: {
                      values: {
                        ...snapshotFilter.values,
                        elementsSelector
                      }
                    }
                  })
                }
              }
            }}
          />
        </React.Fragment>
      )
    break
  }

  return (
    <div { ...props }>
      {editor}

      <aside>
        <UI.Button backgroundColor='red' onClick={() => setIsDeleting(true)}>
          <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
        </UI.Button>
      </aside>
    </div>
  )
})`
  position: relative;
  display: block;
  min-height: 35px;
  margin: 5px 0;
  font-size: 15px;
  line-height: 20px;

  > ${UI.Select} {
    width: 100%;

    > select {
      width: 100%;
      height: 35px;
      font-size: 15px;
      padding: 3px;
    }

    > b {
      line-height: 35px;
    }

    &:last-of-type {
      > select {
        padding-right: 26px;
      }
    }
  }

  > ${UI.Input} {
    > input {
      height: 35px;
      font-size: 15px;
      padding: 14px 3px 3px;
    }

    &:last-of-type {
      > input {
        padding-right: 26px;
      }
    }
  }

  > aside {
    position: absolute;
    top: 7px;
    right: 0;
    opacity: 0;
    transition: opacity 0.25s ease-in-out;

    > div {
      display: inline-block;
      vertical-align: top;
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

export default SnapshotFilter
