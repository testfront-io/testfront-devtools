import React from 'react'
import styled from 'styled-components'
import Avatar from './Avatar'
import Editor from './Editor'
import * as UI from '../../UI'

const Menu = styled(({ store, ...props }) => {
  const [ visible, setVisible ] = React.useState(false)
  const toggleVisibility = () => setVisible(!visible)

  return (
    <div { ...props }>
      <Avatar onClick={toggleVisibility} />

      {visible && (!store.session.user ? (
        <UI.Modal center={true}>
          <UI.Modal.CloseButton onClick={toggleVisibility} />
        </UI.Modal>
      ) : (
        <UI.Modal>
          <UI.Header>
            <span>
              {store.session.user && store.session.user.firstName ? `Hey ${store.session.user.firstName}!` : `Hello!`}
            </span>
          </UI.Header>

          <Editor store={store} user={store.session.user} />

          <UI.Modal.CloseButton onClick={toggleVisibility} />
        </UI.Modal>
      ))}
    </div>
  )
})`
  display: inline-block;

  > ${Avatar} {
    cursor: pointer;
  }

  > ${UI.Modal} {
    > div {
      padding-top: ${({ store }) => store.session.user ? `60px` : `0`};

      ${UI.Header} {
        > span {
          display: inline-block;
          color: ${({ theme }) => theme.colors.text};
          font-size: 35px;
          line-height: 40px;
          letter-spacing: -2px;
          white-space: nowrap;
        }
      }
    }
  }
`

export default Menu
