import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import octicons from 'octicons'

const Avatar = styled(({ id = `Avatar`, ...props }) => props.src ? (
  <img id={id} alt='Avatar' { ...props } />
) : (
  <span id={id} { ...props } dangerouslySetInnerHTML={{ __html: octicons[`person`].toSVG({ width: 16, height: 16 }) }} />
))`
  width: 20px;
  height: 20px;
  padding: 2px;
  border-radius: 50%;
  color: ${({ theme }) => mix(0.1, theme.colors.primary, `rgba(255, 255, 255, 0.5)`)};
  background-color: ${({ theme }) => theme.colors.background};
`

export default Avatar
