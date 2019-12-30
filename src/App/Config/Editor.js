import React from 'react'
import styled from 'styled-components'
import * as UI from '../../UI'

const Editor = styled(({ store, onSubmit, ...props }) => (
  <UI.Form { ...props }>
    <section>
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
    </section>
  </UI.Form>
))`
  width: 300px;
  max-width: 100%;
  padding: 35px 10px 20px;
  margin: 0 auto;

  > section {
    margin-bottom: 30px;

    > ${UI.Input} {
      width: 100%;
      margin-bottom: 10px;
    }
  }

  > section {
    &:last-of-type {
      margin-bottom: 105px;
      text-align: center;

      > ${UI.Button} {
        padding: 5px 30px;
      }
    }
  }
`

export default Editor
