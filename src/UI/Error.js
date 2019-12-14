import styled, { css } from 'styled-components'

const Error = styled.div`
  min-height: 40px;
  padding: 10px;
  border: 0;
  margin: 0;
  color: ${({ theme }) => theme.colors.red || `rgba(255, 63, 63, 0.9)`};
  text-transform: uppercase;

  ${({ center = true }) => center ? css`
    text-align: center;
  ` : ``}

  &:empty {
    display: none;
  }
`

export default Error
