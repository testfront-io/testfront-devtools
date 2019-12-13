import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'

const Button = styled(({ backgroundColor, type = `button`, ...props }) => (
  <button type={type} { ...props } />
))`
  display: inline-block;
  vertical-align: middle;
  height: 30px;
  padding: 5px 10px;
  margin: 0;
  border: 0;
  border-radius: 3px;
  font-size: 18px;
  font-weight: normal;
  line-height: 20px;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
  color: ${({ color, theme }) => theme.colors[color] || color || `white`};
  background: ${({ backgroundColor, theme }) => mix(0.75, theme.colors[backgroundColor] || backgroundColor || theme.colors.primary, `rgba(31, 31, 31, 1)`)};
  cursor: pointer;
  transition: color 0.25s ease-in-out, background 0.25s ease-in-out;

  &:hover {
    background: ${({ backgroundColor, theme }) => theme.colors[backgroundColor] || backgroundColor || theme.colors.primary};
  }

  &:active {
    background: ${({ backgroundColor, theme }) => theme.colors[backgroundColor] || backgroundColor || theme.colors.primary};
    transition: color 0.25s ease-in-out, background 0.25s ease-in-out;
  }

  > span {
    display: inline-block;
    vertical-align: top;
    height: 20px;

    ~ span {
      margin-left: 6px;
      margin-right: 2px;
    }
  }
`

export default Button
