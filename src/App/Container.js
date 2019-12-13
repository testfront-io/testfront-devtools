import React from 'react'
import PropTypes from 'prop-types'
import styled, { ThemeProvider } from 'styled-components'
import * as Store from './Store'

const Container = styled(({ title, theme, ...props }) => {
  React.useEffect(() => {
    document.title = title
  }, [ title ])

  return (
    <ThemeProvider theme={theme}>
      <Store.Provider>
        <main { ...props } />
      </Store.Provider>
    </ThemeProvider>
  )
})`
  position: relative;
  padding: 60px 10px 10px;
  color: ${({ theme }) => theme.colors.text};
  max-width: 100%;
  min-height: calc(100vh);
  overflow-x: hidden;
`

Container.propTypes = {
  title: PropTypes.string.isRequired,
  theme: PropTypes.object.isRequired
}

Container.defaultProps = {
  title: `TestFront.io DevTools`,
  theme: {
    colors: {
      background: `#222222`,
      primary: `#4070e0`,
      text: `#bbbbbb`,
      red: `#d02000`,
      green: `#309000`,
      blue: `#4070e0`,
      yellow: `#e0e040`
    }
  }
}

export default Container
