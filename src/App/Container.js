import React from 'react'
import styled from 'styled-components'

const Container = styled(({ title, theme, ...props }) => {
  React.useEffect(() => {
    document.title = title
  }, [ title ])

  return (
    <main { ...props } />
  )
})`
  position: relative;
  padding: 60px 10px 10px;
  color: ${({ theme }) => theme.colors.text};
  max-width: 100%;
  min-height: calc(100vh);
  overflow-x: hidden;
`

Container.defaultProps = {
  title: `TestFront.io DevTools`
}

export default Container
