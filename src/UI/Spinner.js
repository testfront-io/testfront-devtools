import React from 'react'
import styled, { css } from 'styled-components'
import { mix } from 'polished'

/**
 * Provide a `spin` prop as `false` if you want to stop the spinning.
 */
const Spinner = styled(({ spin, children, ...props }) => (
  <div { ...props }>
    <div />

    {children}
  </div>
))`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  margin: 0 auto;

  > div:first-child {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 50%;
    transition: border-color .8s ease-in-out;

    ${({ spin = true }) => spin ? css`
      animation: rotation .8s ease infinite;
      border: 3px solid ${({ theme }) => mix(0.5, theme.colors.primary || `rgba(191, 191, 191, 1)`, `rgba(191, 191, 191, 1)`)};
      border-top-color: ${({ theme }) => mix(0.5, theme.colors.primary || `rgba(63, 63, 63, 1)`, `rgba(63, 63, 63, 1)`)};
    ` : css`
      border: 3px solid ${({ theme }) => mix(0.5, theme.colors.primary || `rgba(63, 63, 63, 1)`, `rgba(63, 63, 63, 1)`)};
    `}
  }

  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

export default Spinner
