import styled from 'styled-components'

const Text = styled.p`
  font-size: 18px;
  margin: 15px 0;

  &:empty {
    display: none;
  }
`

export default Text
