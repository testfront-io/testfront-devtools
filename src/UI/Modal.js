import React from 'react'
import styled from 'styled-components'
import octicons from 'octicons'

/**
 * You can center the modal's contents (both horizontally and vertically) by passing `center` as `true`.
 */
const Modal = styled(({ center, children, ...props }) => center ? (
  <div { ...props }>
    <div>
      <div>
        <div>
          {children}
        </div>
      </div>
    </div>
  </div>
) : (
  <div { ...props }>
    <div>
      {children}
    </div>
  </div>
))`
  z-index: 2000;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.background};
  overflow: auto;

  > div {
    position: relative;
    width: 600px;
    max-width: 100%;
    min-height: 100%;
    margin: 0 auto;

    ${({ center }) => center ? `
      > div {
        display: table;
        padding: 10px;
        margin: 0 auto;
        width: 100%;
        max-width: 600px;
        min-height: 100vh;

        > div {
          display: table-cell;
          vertical-align: middle;
        }
      }
    ` : `
      padding: 10px;
    `}
  }
`

/**
 * You can render this within your `Modal` with an `onClick` handler.
 */
Modal.CloseButton = styled(({ type = `button`, dangerouslySetInnerHTML = { __html: octicons[`x`].toSVG({ width: 20, height: 20 }) }, ...props }) => (
  <button type={type} dangerouslySetInnerHTML={dangerouslySetInnerHTML} { ...props } />
))`
  z-index: 1002;
  position: relative;
  width: 30px;
  height: 30px;
  padding: 5px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
`

export default Modal
