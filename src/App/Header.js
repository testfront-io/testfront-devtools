import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import * as UI from '../UI'
import Logo from './Logo'
import * as Config from './Config'
import * as Session from './Session'
import * as User from './User'

export const Container = styled(UI.Header)`
  background: #343434;
  box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.05);

  ${User.Avatar} {
    position: absolute;
    top: 5px;
    right: 10px;
    cursor: pointer;
  }

  ${Config.Menu} {
    position: absolute;
    top: 5px;
    right: 35px;
    cursor: pointer;
  }
`

const LogoContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  padding: 5px 10px;
`

const Header = (props) => (
  <Container { ...props }>
    <LogoContainer>
      <Link to='/'>
        <Logo />
      </Link>
    </LogoContainer>

    <Config.Menu />
    <Session.Menu />
  </Container>
)

export default Header
