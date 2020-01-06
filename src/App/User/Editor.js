import React from 'react'
import styled from 'styled-components'
import * as UI from '../../UI'

const Editor = styled(({ store, ...props }) => (
  <UI.Form { ...props }>
  </UI.Form>
))`
  width: 330px;
  padding: 30px 15px;
  margin: 0 auto;
  text-align: center;

  > ${UI.Input} {
    width: 100%;
    margin-bottom: 15px;
  }
`

export default Editor
