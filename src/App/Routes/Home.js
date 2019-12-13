import React from 'react'
import Container from '../Container'
import Header from '../Header'
import * as Tests from '../Tests'

const Home = () => (
  <Container title='Home'>
    <Header />
    <Tests.Editor />
  </Container>
)

export default Home
