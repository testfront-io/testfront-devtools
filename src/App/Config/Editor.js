import React from 'react'
import styled from 'styled-components'
import * as UI from '../../UI'
import * as Store from '../Store'

// Customize the default UI.Form a bit.
export const Form = styled(UI.Form)`
  padding: 35px 10px 20px;
  margin: 0 auto;

  ${UI.Combo},
  ${UI.Input},
  ${UI.List},
  ${UI.Select},
  ${UI.Textarea} {
    width: 100%;
    margin-bottom: 10px;
  }
`

const Editor = () => (
  <Store.Context.Consumer>
    {({ error, setData }) => (
      <Form onSubmit={async (event, formData) => setData(data => ({
        tests: {
          ...data.tests,
          ...formData
        }
      }))}>
        <UI.Error>
          {error.tests || ``}
        </UI.Error>
      </Form>
    )}
  </Store.Context.Consumer>
)

export default Editor
