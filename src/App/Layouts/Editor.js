import React from 'react'
import Container from '../Container'
import Header from '../Header'
import * as Editor from '../Editor'
import * as Store from '../Store'

export default () => (
  <Container title='Editor'>
    <Store.Context.Consumer>
      {store => (
        <React.Fragment>
          <Header />

          <Editor.TestGroups
            store={store}
            testGroups={store.data.testGroups}
          />
        </React.Fragment>
      )}
    </Store.Context.Consumer>
  </Container>
)
