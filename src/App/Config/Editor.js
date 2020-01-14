import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import * as UI from '../../UI'
import SnapshotFilter from '../Editor/SnapshotFilter'

const Editor = styled(({ store, onSubmit, ...props }) => (
  <UI.Form { ...props }>
    <details open={true}>
      <summary>
        Data
      </summary>

      <div>
        <UI.Select
          placeholder='Source'
          value={store.config.source}
          onChange={event => {
            const source = event.target.value

            if (store.config.source !== source) {
              store.updateStore(store => ({
                config: {
                  ...store.config,
                  source
                }
              }))
            }
          }}
        >
          <option value='server'>server</option>
          <option value='local'>local</option>
        </UI.Select>

        {store.config.source === `server` && (
          <UI.Input
            placeholder='Server Base URL'
            value={store.config.serverBaseURL}
            onBlur={event => {
              const serverBaseURL = event.target.value

              if (store.config.serverBaseURL !== serverBaseURL) {
                store.updateStore(store => ({
                  config: {
                    ...store.config,
                    serverBaseURL
                  }
                }))
              }
            }}
          />
        )}
      </div>
    </details>

    <details open={true}>
      <summary>
        Time Limits
      </summary>

      <div>
        <UI.Input
          type='number'
          name='timeLimits.test'
          placeholder='Test Time Limit (ms)'
          value={store.data.timeLimits.test}
          onBlur={event => {
            const test = Number(event.target.value)

            if (test !== store.data.timeLimits.test) {
              store.updateStore(store => ({
                data: {
                  timeLimits: {
                    ...store.data.timeLimits,
                    test
                  }
                }
              }))
            }
          }}
        />

        <UI.Input
          type='number'
          name='timeLimits.saveData'
          placeholder='Save Data Delay (ms)'
          value={store.data.timeLimits.saveData}
          onBlur={event => {
            const saveData = Number(event.target.value)

            if (saveData !== store.data.timeLimits.saveData) {
              store.updateStore(store => ({
                data: {
                  timeLimits: {
                    ...store.data.timeLimits,
                    saveData
                  }
                }
              }))
            }
          }}
        />
      </div>
    </details>

    <details open={true}>
      <summary>
        Global Snapshot Filters
      </summary>

      <div>
        {store.data.snapshotFilters.map((snapshotFilter, snapshotFilterIndex) => (
          <SnapshotFilter
            key={`SnapshotFilter_${snapshotFilterIndex}`}
            store={store}
            snapshotFilterIndex={snapshotFilterIndex}
            snapshotFilter={snapshotFilter}
          />
        ))}

        <center>
          <UI.Button onClick={() => store.addSnapshotFilter()}>
            <span>Add Filter</span>
          </UI.Button>
        </center>
      </div>
    </details>
  </UI.Form>
))`
  width: 300px;
  max-width: 100%;
  margin: 0 auto;

  > details {
    padding: 10px;
    margin-bottom: 30px;
    box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.05);
    background: ${({ theme }) => mix(0.5, theme.colors.background, `rgba(47, 47, 47, 1)`)};

    > summary {
      font-size: 20px;
      line-height: 1;
      cursor: pointer;

      &:hover {
        color: white;
      }
    }

    > div {
      margin-top: 10px;

      > ${UI.Input},
      > ${UI.Select} {
        display: block;
        width: 100%;
      }
    }
  }
`

export default Editor
