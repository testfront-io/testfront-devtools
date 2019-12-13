import React from 'react'
import styled from 'styled-components'

/**
 * Typical usage is to pass `dangerouslySetInnerHTML={{ __html: octicons[iconKey].toSVG({ width: 30, height: 30 }) }}`.
 */
const Icon = styled((props) => (
  <span { ...props } />
))`
  display: inline-block;
  width: 30px;
  height: 30px;
`

export default Icon
