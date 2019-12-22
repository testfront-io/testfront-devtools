import React from 'react'
import { HashRouter, Switch, Route } from 'react-router-dom'
import * as Layouts from './Layouts'

const App = () => (
  <HashRouter>
    <Switch>
      <Route exact path='/'>
        <Layouts.Editor />
      </Route>
    </Switch>
  </HashRouter>
)

export default App
