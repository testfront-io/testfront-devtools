import React from 'react'
import { withTheme } from 'styled-components'
import octicons from 'octicons'
import Rotate from './Rotate'

const StateIcon = withTheme(({
  theme,
  recording,
  testing,
  routeIndex,
  testIndex,
  recordedItemIndex,
  state,
  skip,
  iconKey,
  width = 15,
  height = 15,
  style,
  ...props
}) => {
  if (skip) {
    return (
      <span dangerouslySetInnerHTML={{
        __html: octicons[`dash`].toSVG({ width, height })
      }} { ...props } />
    )
  }

  if (
    recording.routeIndex === routeIndex
    && (typeof testIndex === `undefined` || recording.testIndex === testIndex)
    && (typeof recordedItemIndex === `undefined` || recording.recordedItemIndex === recordedItemIndex)
  ) {
    state = `RECORDING`
  } else if (
    testing.routeIndex === routeIndex
    && (typeof testIndex === `undefined` || testing.testIndex === testIndex)
    && (typeof recordedItemIndex === `undefined` || testing.recordedItemIndex === recordedItemIndex)
  ) {
    state = `TESTING`
  }

  switch (state) {
    case `RECORDING`:
      return (
        <span style={{ color: theme.colors.red || `red`, ...style }} dangerouslySetInnerHTML={{
          __html: octicons[`primitive-dot`].toSVG({ width, height })
        }} { ...props } />
      )

    case `TESTING`:
      return (
        <Rotate style={{ color: theme.colors.yellow || `yellow`, ...style }} dangerouslySetInnerHTML={{
          __html: octicons[`sync`].toSVG({ width, height })
        }} { ...props } />
      )

    case `PASSED`:
      return (
        <span style={{ color: theme.colors.green || `green`, ...style }} dangerouslySetInnerHTML={{
          __html: octicons[`check`].toSVG({ width, height })
        }} { ...props } />
      )

    case `FAILED`:
      return (
        <span style={{ color: theme.colors.red || `red`, ...style }} dangerouslySetInnerHTML={{
          __html: octicons[`x`].toSVG({ width, height })
        }} { ...props } />
      )

    default:
      return (
        <span style={style} dangerouslySetInnerHTML={{
          __html: octicons[iconKey].toSVG({ width, height })
        }} { ...props } />
      )
  }
})

export default StateIcon
