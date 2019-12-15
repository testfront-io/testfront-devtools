import React from 'react'
import Container from '../Container'
import Header from '../Header'
import * as Tests from '../Tests'

export default ({ routeIndex }) => (
  <Container title='Tests'>
    <Header />
    <Tests.Editor routeIndex={routeIndex} />
  </Container>
)
