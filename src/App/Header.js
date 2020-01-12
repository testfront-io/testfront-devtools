import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import { Link } from 'react-router-dom'
import octicons from 'octicons'
import * as UI from '../UI'
import * as Config from './Config'
import * as User from './User'

const Header = styled(({ store, ...props }) => (
  <UI.Header { ...props }>
    <div>
      <Link to='/'>
        <span>
          <span>Test</span><span>Front</span>
        </span>
      </Link>
    </div>

    <aside>
      <UI.Icon
        title={(
          (store.shouldSaveData && `Changes pending save...`)
          || (store.status === `saving` && `Saving...`)
          || `All changes saved.`
        )}
        dangerouslySetInnerHTML={{ __html: octicons[`database`].toSVG({ width: 18, height: 18 }) }}
        onClick={() => store.saveData()}
      />

      <Config.Menu store={store} />
      <User.Menu store={store} />
    </aside>
  </UI.Header>
))`
  background: ${({ theme }) => mix(0.5, theme.colors.background, `rgba(63, 63, 63, 1)`)};
  box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.05);

  > div {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 30px;
    padding: 5px 10px;

    > a {
      display: inline-block;
      vertical-align: middle;
      font-size: 20px;
      line-height: 1;

      > span {
        display: inline-block;
        vertical-align: middle;
        color: ${({ theme }) => theme.colors.text};
        text-transform: uppercase;
        font-size: 20px;
        line-height: 1;
        letter-spacing: -2px;
        white-space: nowrap;

        > span {
          display: inline-block;
          vertical-align: middle;
          margin-right: 2px;

          &:nth-child(odd) {
            color: ${({ theme }) => theme.colors.primary};
          }
        }
      }
    }
  }

  > aside {
    position: absolute;
    top: 5px;
    right: 10px;

    > ${UI.Icon} {
      width: 20px;
      height: 20px;
      padding: 1px;
      color: ${({ store, theme }) => (store.shouldSaveData || store.status === `saving`) ? theme.colors.yellow : theme.colors.green};
      opacity: ${({ store, theme }) => store.shouldSaveData ? 0.75 : 0.9};
      cursor: pointer;
      transition: all 0.25s ease-in-out;

      &:hover {
        color: ${({ theme }) => theme.colors.blue};
        opacity: 1;
      }
    }

    > * {
      vertical-align: middle;
      margin-left: 5px;
    }
  }
`

export default Header
