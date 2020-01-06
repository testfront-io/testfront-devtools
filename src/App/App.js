import React from 'react'
import { ThemeProvider } from 'styled-components'
import { HashRouter, Switch, Route } from 'react-router-dom'
import * as Store from './Store'
import * as Layouts from './Layouts'

const App = ({ theme }) => (
  <ThemeProvider theme={theme}>
    <Store.Provider>
      <HashRouter>
        <Switch>
          <Route>
            <Layouts.Editor />
          </Route>
        </Switch>
      </HashRouter>
    </Store.Provider>
  </ThemeProvider>
)

App.defaultProps = {
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

export default App
