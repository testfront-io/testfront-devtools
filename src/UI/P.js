import styled from 'styled-components'

const Text = styled.p`
  margin: 15px 0;
  font-size: 18px;
  line-height: 1.2;

  &:empty {
    display: none;
  }
`

export default Text
