import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'

/**
 * Works just like the native `textarea` element, but looks better.
 */
const Textarea = styled(({
  className,
  placeholder,
  value = ``,
  onChange,
  onKeyUp,
  onKeyDown,
  onKeyPress,
  children,
  ...props
}) => {
  const [ state, setState ] = React.useState({ value })
  const handleChange = event => {
    setState({ value: event.target.value })

    if (onChange) {
      onChange(event, setState)
    }
  }

  React.useEffect(() => setState({ value }), [ value ])

  return (
    <span className={className} data-placeholder={placeholder}>
      <textarea
        { ...props }
        value={state.value}
        onChange={handleChange}
        onKeyUp={onKeyUp && (event => onKeyUp(event, setState))}
        onKeyDown={onKeyDown && (event => onKeyDown(event, setState))}
        onKeyPress={onKeyPress && (event => onKeyPress(event, setState))}
      />

      {children}

      <span>{placeholder}</span>
    </span>
  )
})`
  position: relative;
  display: inline-block;
  vertical-align: middle;

  > textarea {
    display: inline-block;
    vertical-align: middle;
    width: 100%;
    height: 100%;
    min-height: 150px;
    margin: 0;
    padding: 19px 3px 3px;
    border: 1px solid transparent;
    border-bottom-color: transparent;
    border-radius: 1px;
    background: rgba(0, 0, 0, 0.25);
    color: rgba(255, 255, 255, 0.9);
    font-size: 18px;
    font-family: inherit;
    line-height: 1.25;
    text-align: inherit;
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
  }
`

export default Textarea
