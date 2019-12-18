import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import Button from './Button'

/**
 * Works just like the native `select` element, but looks better.
 */
const Select = styled(({
  className,
  name,
  placeholder,
  value = ``,
  onChange,
  ...props
}) => {
  const [ state, setState ] = React.useState({ value })

  React.useEffect(() => setState({ value }), [ value ])

  return (
    <span className={className} data-placeholder={(placeholder && typeof placeholder === `object`) ? undefined : placeholder}>
      <select { ...props } name={name} value={state.value} onChange={event => {
        const { value } = event.target

        setState({ value })

        if (onChange) {
          onChange({ ...event, target: { name, value } })
        }
      }} />

      {(placeholder && typeof placeholder === `object`) ? placeholder : (
        <React.Fragment>
          <span>{placeholder}</span>
          <b>▼</b>
        </React.Fragment>
      )}
    </span>
  )
})`
  position: relative;
  display: inline-block;
  vertical-align: middle;

  > select {
    display: inline-block;
    vertical-align: middle;
    width: 100%;
    height: 45px;
    margin: 0;
    padding: 17px 22px 0 3px;
    border: 1px solid transparent;
    border-bottom-color: transparent;
    border-radius: 1px;
    background: rgba(0, 0, 0, 0.25);
    color: rgba(255, 255, 255, 0.9);
    font-size: 18px;
    line-height: 21px;
    text-align: inherit;
    appearance: none;
    transition: all 0.25s ease-in-out;

    &:hover {
      border-bottom-color: ${({ theme }) => mix(0.1, theme.colors.primary || `rgba(223, 223, 223, 0.75)`, `rgba(223, 223, 223, 0.75)`)};
      background: rgba(0, 0, 0, 0.5);
    }

    &:focus,
    &:focus:hover {
      border-bottom-color: ${({ theme }) => theme.colors.primary};
      background: rgba(0, 0, 0, 0.5);
    }

    &:hover,
    &:focus,
    &:focus:hover {
      box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.05);
    }

    ~ span {
      position: absolute;
      width: 100%;
      top: 3px;
      left: 3px;
      font-size: 11px;
      line-height: 1;
      white-space: nowrap;
      color: gray;
      text-transform: uppercase;
      pointer-events: none;
      transition: all 0.25s ease-in-out;
    }

    &:hover ~ span {
      color: inherit;
    }

    &:focus ~ span {
      color: ${({ theme }) => theme.colors.primary};
      text-shadow: 0 0 ${({ theme }) => theme.colors.primary};
    }

    &[disabled] {
      ~ b {
        display: none;
      }
    }

    ~ ${Button} {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
  }

  b {
    position: absolute;
    top: 1px;
    bottom: 1px;
    right: 1px;
    padding: 0 5px;
    font-size: 12px;
    font-weight: normal;
    line-height: 40px;
    background-color: ${({ theme }) => theme.colors.background};
    pointer-events: none;
    opacity: 0.25;
    transition: all 0.25s ease-in-out;
  }

  &:hover {
    b {
      opacity: 0.5;
    }
  }
`

export default Select
