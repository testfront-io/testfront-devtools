import React from 'react'
import styled from 'styled-components'

const Rotate = styled((props) => (
  <span { ...props } />
))`
  animation: rotate 2s linear infinite;

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
`

export default Rotate
