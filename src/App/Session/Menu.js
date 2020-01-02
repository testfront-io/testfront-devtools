import React from 'react'
import styled from 'styled-components'
import * as UI from '../../UI'
import * as User from '../User'
import Context from './Context'

const Menu = styled(({ store, ...props }) => {
  const [ visible, setVisible ] = React.useState(false)
  const toggleVisibility = () => setVisible(!visible)

  return (
    <div { ...props }>
      <User.Avatar onClick={toggleVisibility} />

      {visible && (
        <UI.Modal>
          <Context.Consumer>
            {({ user }) => (
              <UI.Header>
                <span>
                  {user ? `Hey ${user.firstName}!` : `Hello!`}
                </span>

                <UI.Modal.CloseButton
                  style={{ position: `absolute`, top: 0, right: 7.5 }}
                  onClick={toggleVisibility}
                />
              </UI.Header>
            )}
          </Context.Consumer>

          <User.Editor store={store} />
        </UI.Modal>
      )}
    </div>
  )
})`
  display: inline-block;
  vertical-align: middle;

  > ${User.Avatar} {
    vertical-align: middle;
    cursor: pointer;
  }

  > ${UI.Modal} {
    > div {
      padding-top: 60px;

      > ${UI.Header} {
        > span {
          color: ${({ theme }) => theme.colors.text};
          text-transform: uppercase;
          font-size: 20px;
          line-height: 1;
          letter-spacing: -2px;
          white-space: nowrap;
        }
      }
    }
  }
`

export default Menu
