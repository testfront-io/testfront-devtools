import React from 'react'
import styled from 'styled-components'
import * as UI from '../../UI'

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
  </UI.Form>
))`
  > details {
    margin-bottom: 30px;

    > summary {
      font-size: 20px;
      line-height: 1;
      margin-bottom: 10px;
      cursor: pointer;

      &:hover {
        color: white;
      }
    }

    > div {
      padding-left: 20px;

      > ${UI.Input},
      > ${UI.Select} {
        display: block;
        width: 50%;
        margin-top: 5px;

        &:first-child {
          margin-top: 0;
        }
      }
    }
  }
`

export default Editor
