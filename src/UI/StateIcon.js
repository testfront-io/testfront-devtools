import React from 'react'
import styled, { withTheme } from 'styled-components'
import octicons from 'octicons'
import Rotate from './Rotate'

import {
  IDLE,
  RECORDING,
  TESTING,

  UNTESTED,
  PASSED,
  FAILED
} from '../constants'

const StateIcon = styled(withTheme(({
  theme,
  store,
  testGroupIndex,
  testGroup,
  testIndex,
  test,
  frameIndex,
  frame,
  iconKey,
  width = 30,
  height= 30,
  style,
  title,
  ...props
}) => {
  let state = store.state
  let skip = testGroup ? test ? test.skip : testGroup.skip : false

  if (skip && !iconKey) {
    iconKey = `dash`
  }

  if (!title) {
    title = state
  }

  if (state === IDLE || (testGroup && store.testGroupIndex !== testGroupIndex) || (test && store.testIndex !== testIndex) || (frame && store.frameIndex !== frameIndex)) {
    state = testGroup ? test ? frame ? frame.state : test.state : testGroup.state : store.data.state

    if (frame && state !== PASSED && state !== FAILED && octicons[iconKey]) {
      state = ``
    }
  }

  switch (state) {
    case RECORDING:
    return (
      <span title={title} style={{ color: theme.colors.red || `red`, ...style }} dangerouslySetInnerHTML={{
        __html: octicons[`primitive-dot`].toSVG({ width, height })
      }} { ...props } />
    )

    case TESTING:
    return (
      <Rotate title={title} style={{ color: theme.colors.yellow || `yellow`, ...style }} dangerouslySetInnerHTML={{
        __html: octicons[`sync`].toSVG({ width, height })
      }} { ...props } />
    )

    case UNTESTED:
    return (
      <span title={title} style={style} dangerouslySetInnerHTML={{
        __html: octicons[`question`].toSVG({ width, height })
      }} { ...props } />
    )

    case PASSED:
    return (
      <span title={title} style={{ color: theme.colors.green || `green`, ...style }} dangerouslySetInnerHTML={{
        __html: octicons[`check`].toSVG({ width, height })
      }} { ...props } />
    )

    case FAILED:
    return (
      <span title={title} style={{ color: theme.colors.red || `red`, ...style }} dangerouslySetInnerHTML={{
        __html: octicons[`x`].toSVG({ width, height })
      }} { ...props } />
    )

    default:
    return octicons[iconKey] ? (
      <span title={title} style={style} dangerouslySetInnerHTML={{
        __html: octicons[iconKey].toSVG({ width, height })
      }} { ...props } />
    ) : (
      <span title={title} style={style} { ...props } />
    )
  }
}))`
  display: inline-block;
  width: 30px;
  height: 30px;
`

export default StateIcon
