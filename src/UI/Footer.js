import React from 'react'
import styled, { css } from 'styled-components'

/**
 * Pass `fixed` as `true` to stick this `fixed` element to the bottom.
 */
const Footer = styled((props) => (
  <footer { ...props } />
))`
  z-index: 1000;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  padding: 5px;

  ${({ fixed }) => fixed ? css`
    position: fixed;
  ` : ``}
`

export default Footer
