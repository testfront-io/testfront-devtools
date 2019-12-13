import React from 'react'
import { HashRouter, Switch, Route } from 'react-router-dom'
import * as Routes from './Routes'

const App = () => (
  <HashRouter>
    <Switch>
      <Route exact path='/'>
        <Routes.Home />
      </Route>
    </Switch>
  </HashRouter>
)

export default App
