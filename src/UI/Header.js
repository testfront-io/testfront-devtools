import React from 'react'
import styled, { css } from 'styled-components'

/**
 * Pass `fixed` as `true` to stick this `header` element to the top.
 */
const Header = styled(({ role = `banner`, ...props }) => (
  <header role={role} { ...props } />
))`
  z-index: 1001;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  padding: 5px 10px;

  ${({ fixed }) => fixed ? css`
    position: fixed;
  ` : ``}
`

export default Header
