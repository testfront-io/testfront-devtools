import React from 'react'
import styled from 'styled-components'
import octicons from 'octicons'
import * as UI from '../../UI'
import Editor from './Editor'

export const Icon = styled(UI.Icon)`
  width: 20px;
  height: 20px;
  padding: 1px;
  vertical-align: middle;
`

export const Header = styled(UI.Header)`
  > span {
    color: ${({ theme }) => theme.colors.text};
    text-transform: uppercase;
    font-size: 20px;
    line-height: 1;
    letter-spacing: -2px;
    white-space: nowrap;
  }
`

const Menu = styled((props) => {
  const [ visible, setVisible ] = React.useState(false)
  const toggleVisibility = () => setVisible(!visible)

  return visible ? (
    <UI.Modal center={true}>
      <Header>
        <span>
          Config
        </span>

        <UI.Modal.CloseButton
          style={{ position: `absolute`, top: 0, right: 5 }}
          onClick={toggleVisibility}
        />
      </Header>

      <Editor />
    </UI.Modal>
  ) : (
    <div { ...props }>
      <Icon
        dangerouslySetInnerHTML={{ __html: octicons[`gear`].toSVG({ width: 18, height: 18 }) }}
        onClick={toggleVisibility}
      />
    </div>
  )
})``

export default Menu
