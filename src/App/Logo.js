import React from 'react'
import styled from 'styled-components'

const Logo = styled((props) => (
  <span { ...props }>
    <span>Test</span><span>Front</span>
  </span>
))`
  display: inline-block;
  vertical-align: middle;
  color: ${({ theme }) => theme.colors.text};
  text-transform: uppercase;
  font-size: 20px;
  line-height: 1;
  letter-spacing: -2px;
  white-space: nowrap;

  > span {
    display: inline-block;
    margin-right: 2px;
    
    &:nth-child(odd) {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`

export default Logo
