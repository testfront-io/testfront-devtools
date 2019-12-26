import React from 'react'
import styled from 'styled-components'
import * as UI from '../../UI'

const Editor = styled(({ store, onSubmit, ...props }) => {
  const [ submitText, setSubmitText ] = React.useState(``)

  return (
    <UI.Form { ...props } onSubmit={(event, data) => {
      if (submitText) {
        return
      }

      setSubmitText(`Saving...`)

      store.updateStore(store => {
        setSubmitText(`Saved!`)
        setTimeout(() => setSubmitText(``), 3000)

        return {
          data
        }
      })

      if (onSubmit) {
        onSubmit(event, data)
      }
    }}>
      <section>
        <UI.Input
          type='number'
          name='timeLimits.snapshotHtml'
          placeholder='Snapshot Time Limit (ms)'
          value={store.data.timeLimits.snapshotHtml}
        />

        <UI.Input
          type='number'
          name='timeLimits.simulateEvent'
          placeholder='Simulate Event Time Limit (ms)'
          value={store.data.timeLimits.simulateEvent}
        />
      </section>

      <section>
        <UI.Button type='submit' backgroundColor='green'>
          <span>{submitText || `Save`}</span>
        </UI.Button>
      </section>
    </UI.Form>
  )
})`
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
