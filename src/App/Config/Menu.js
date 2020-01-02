import React from 'react'
import styled from 'styled-components'
import octicons from 'octicons'
import * as UI from '../../UI'
import Editor from './Editor'

const Menu = styled(({ store, ...props }) => {
  const [ visible, setVisible ] = React.useState(false)
  const toggleVisibility = () => setVisible(!visible)

  return (
    <div { ...props }>
      <UI.Icon
        dangerouslySetInnerHTML={{ __html: octicons[`gear`].toSVG({ width: 18, height: 18 }) }}
        onClick={toggleVisibility}
      />

      {visible && (
        <UI.Modal>
          <UI.Header>
            <span>
              Config
            </span>

            <UI.Modal.CloseButton
              style={{ position: `absolute`, top: 0, right: 5 }}
              onClick={toggleVisibility}
            />
          </UI.Header>

          <Editor store={store} />
        </UI.Modal>
      )}
    </div>
  )
})`
  display: inline-block;
  vertical-align: middle;

  > ${UI.Icon} {
    width: 20px;
    height: 20px;
    padding: 1px;
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
