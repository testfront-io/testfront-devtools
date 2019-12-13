import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'

/**
 * Attempt to normalize datetime inputs across different browsers.
 */
export const DateTimeInput = ({ name, value, offsetTime = 0, onChange, style, ...props }) => {
  const [ state, setState ] = React.useState({ value })

  const [ date, time ] = new Date(new Date(state.value).getTime() + offsetTime)
    .toISOString()
    .replace(/Z$/, ``)
    .replace(/\.[0-9][0-9][0-9]$/, ``)
    .replace(/:[0-9][0-9]$/, `:00`)
    .split(`T`)

  const getValue = (date, time) => {
    let value = new Date(new Date().getTime() - offsetTime).toISOString()

    try {
      value = new Date(new Date(`${date}T${time}Z`).getTime() - offsetTime).toISOString()
    } catch (error) {
    }

    return value
  }

  React.useEffect(() => setState({ value }), [ value, offsetTime ])

  return (
    <React.Fragment>
      <input
        { ...props }
        type='date'
        style={{ ...style, width: `55%` }}
        value={date}
        onChange={event => {
          const date = event.target.value
          const value = date && getValue(date, time)

          if (value) {
            setState({ value })

            if (onChange) {
              onChange({ ...event, target: { name, value } })
            }
          }
        }}
      />

      <input
        { ...props }
        type='time'
        style={{ ...style, width: `45%` }}
        value={time}
        onChange={event => {
          let time = event.target.value
          while (time.split(`:`).length < 3) {
            time = `${time}:00`
          }
          const value = time && getValue(date, time)

          if (value) {
            setState({ value })

            if (onChange) {
              onChange({ ...event, target: { name, value } })
            }
          }
        }}
      />

      {name && (
        <input
          type='hidden'
          name={name}
          value={state.value}
        />
      )}
    </React.Fragment>
  )
}

/**
 * Works just like the native `input` element, but looks better.
 */
const Input = styled(({
  className,
  type = `text`,
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
      {(type === `datetime-local` || type === `datetime`) ? (
        <DateTimeInput
          { ...props }
          value={state.value}
          onChange={handleChange}
          onKeyUp={event => {
            if (onKeyUp) {
              return onKeyUp(event, setState)
            }
          }}
        />
      ) : (
        <input
          type={type || `text`}
          { ...props }
          value={state.value}
          onChange={handleChange}
          onKeyUp={onKeyUp && (event => onKeyUp(event, setState))}
          onKeyDown={onKeyDown && (event => onKeyDown(event, setState))}
          onKeyPress={onKeyPress && (event => onKeyPress(event, setState))}
        />
      )}

      {children}

      <span>{placeholder}</span>
    </span>
  )
})`
  position: relative;
  display: inline-block;
  vertical-align: middle;

  > input {
    display: inline-block;
    vertical-align: middle;
    width: 100%;
    height: 45px;
    margin: 0;
    padding: 19px 3px 5px;
    border: 1px solid transparent;
    border-bottom-color: transparent;
    border-radius: 1px;
    background: rgba(0, 0, 0, 0.25);
    color: rgba(255, 255, 255, 0.9);
    font-size: 18px;
    line-height: 1;
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

    &:focus ~ span {
      color: ${({ theme }) => theme.colors.primary};
      text-shadow: 0 0 ${({ theme }) => theme.colors.primary};
    }
  }
`

export default Input
