import React from 'react'
import styled from 'styled-components'
import * as UI from '../../UI'

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
  <Form />
)

export default Editor
