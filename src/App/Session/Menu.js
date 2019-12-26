import React from 'react'
import styled from 'styled-components'
import * as UI from '../../UI'
import * as User from '../User'
import Context from './Context'

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

const Menu = ({ store }) => {
  const [ visible, setVisible ] = React.useState(false)
  const toggleVisibility = () => setVisible(!visible)

  return visible ? (
    <UI.Modal center={true}>
      <Context.Consumer>
        {({ user }) => (
          <Header>
            <span>
              {user ? `Hey ${user.firstName}!` : `Hello!`}
            </span>

            <UI.Modal.CloseButton
              style={{ position: `absolute`, top: 0, right: 7.5 }}
              onClick={toggleVisibility}
            />
          </Header>
        )}
      </Context.Consumer>

      <User.Editor store={store} />
    </UI.Modal>
  ) : (
    <User.Avatar onClick={toggleVisibility} />
  )
}

export default Menu
