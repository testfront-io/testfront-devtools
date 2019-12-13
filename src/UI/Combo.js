import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'

/**
 * Custom "combo" box. Looks like a select menu, but you can type into it like it's an input.
 * The `value` prop represents the selected value, while the `inputValue` prop represents the value of the input.
 * What you do with the input/selection is up to you - e.g., filtering, adding/removing options, etc.
 */
const Combo = styled(({
  className,
  name,
  placeholder,
  value = ``,
  inputValue = ``,
  onChange,
  children,
  ...props
}) => {
  React.Children.forEach(children, option => {
    if (option.props.value === value && typeof option.props.children === `string`) {
      inputValue = option.props.children
    }
  })

  const [ state, setState ] = React.useState({ value, inputValue })

  React.useEffect(() => setState({ value, inputValue }), [ value, inputValue ])

  if (typeof children === `function`) {
    children = children(state)
  }

  return (
    <span className={className} data-placeholder={placeholder}>
      <input
        { ...props }
        type='text'
        value={state.inputValue}
        onChange={event => setState({ value, inputValue: event.target.value })}
      />

      {name && (
        <input
          type='hidden'
          name={name}
          value={state.value}
        />
      )}

      <ul>
        {React.Children.map(children, option => React.cloneElement(option, {
          onMouseDown: () => {
            const { value } = option.props
            const nextState = { value }

            if (typeof option.props.children === `string`) {
              nextState.inputValue = option.props.children
            }

            setState(nextState)

            if (onChange) {
              onChange({ target: { name, value } }, setState)
            }
          }
        }))}
      </ul>

      <span>{placeholder}</span>
      <b>▼</b>
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
    padding: 19px 22px 5px 3px;
    border: 1px solid transparent;
    border-bottom-color: transparent;
    border-radius: 1px;
    background: rgba(0, 0, 0, 0.25);
    color: rgba(255, 255, 255, 0.9);
    font-size: 18px;
    line-height: 20px;
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

    ~ ul {
      display: none;
      list-style: none;
      margin: 0;
      padding: 3px 0;
      background: ${({ theme }) => mix(0.125, theme.colors.primary, `#bbbbbb`)};
      box-shadow: 0px 10px 10px 0 rgba(0, 0, 0, 0.05);
      position: absolute;
      z-index: 10;
      top: 100%;
      left: 0;
      right: 0;
      max-height: 250px;
      overflow: auto;

      > * {
        padding: 10px 15px;
        font-size: 14px;
        line-height: 1;
        color: rgba(0, 0, 0, 0.75);
        background: ${({ theme }) => mix(0.125, theme.colors.primary, `#bbbbbb`)};
        cursor: pointer;

        &:hover {
          color: rgba(255, 255, 255, 0.75);
          background: ${({ theme }) => mix(0.875, theme.colors.primary, `#bbbbbb`)};
          transition: color 0.25s ease-in-out, background 0.25s ease-in-out;
        }
      }
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

    &:focus {
      ~ ul {
        display: block;
      }

      ~ span {
        color: ${({ theme }) => theme.colors.primary};
        text-shadow: 0 0 ${({ theme }) => theme.colors.primary};
      }
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

export default Combo
