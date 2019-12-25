import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import octicons from 'octicons'

/**
 * Renders a list which looks like the other form elements.
 * You can combine with other form elements (e.g., `Input`, `Combo`, etc.) to modify the list.
 * Uses the `data-json` attribute to provide an array as the value within a `Form`.
 */
const List = styled(({ className, name, placeholder, value, children, useEffect }) => {
  const [ state, setState ] = React.useState({ value })

  React.useEffect(() => useEffect && setState({ value }), [ useEffect, value ])

  return (
    <div className={className} data-placeholder={placeholder}>
      <input
        type='hidden'
        name={name}
        data-json={JSON.stringify(state.value || [])}
      />

      <ul>{children}</ul>
      <span>{placeholder}</span>
    </div>
  )
})`
  position: relative;
  transition: all 0.25s ease-in-out;

  &&& > ul {
    margin: 0;
    padding: 15px 0 3px 0;
    border: 0;
    border-radius: 1px;
    background: rgba(0, 0, 0, 0.25);
    transition: background 0.25s ease-in-out;

    &:hover {
      box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.05);
    }

    &:empty {
      height: 3px;
      padding: 0;
      margin-top: -6px;
    }

    > li {
      position: relative;
      vertical-align: middle;
      list-style-type: none;
      padding: 9px 3px;
      background: transparent;
      color: ${({ theme }) => mix(0.125, theme.colors.primary, `#bbbbbb`)};
      font-size: 14px;
      line-height: 1;
      transition: all 0.25s ease-in-out;

      &:hover {
        background: rgba(0, 0, 0, 0.25);
        color: rgba(255, 255, 255, 0.75);
      }
    }

    ~ span {
      position: absolute;
      width: 100%;
      top: 3px;
      left: 3px;
      font-size: 12px;
      line-height: 1;
      white-space: nowrap;
      color: gray;
      text-transform: uppercase;
      pointer-events: none;
      transition: all 0.25s ease-in-out;
    }
  }
`
/**
 * You can render this within each `li` element with an `onClick` handler to modify your list.
 */
List.ItemRemover = styled(({ type = `button`, dangerouslySetInnerHTML = { __html: octicons[`trashcan`].toSVG() }, ...props }) => (
  <button type={type} dangerouslySetInnerHTML={dangerouslySetInnerHTML} { ...props } />
))`
  position: absolute;
  top: 6px;
  right: 3px;
  width: 20px;
  height: 20px;
  padding: 3px;
  margin: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  opacity: 0.5;
  cursor: pointer;
  transition: all 0.25s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
    opacity: 1;
  }
`

export default List
