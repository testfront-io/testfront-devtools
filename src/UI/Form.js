import React from 'react'

/**
 * Assigns the value to a potentially deep key.
 * @param {string} keys - Can be just one - e.g., `foo` - or it can be deep - e.g., `foo.bar.baz`.
 * @param {*} value - The arbitrary value to be assigned, potentially deeply.
 * @returns {object}
 */
export const getDeepObject = (keys, value, deepObject = {}) => {
  let current = deepObject
  let key

  keys = keys.split(`.`)

  while (keys.length) {
    key = keys.shift()
    current = (current[key] = keys.length ? (current[key] || {}) : value)
  }

  return deepObject
}

/**
 * Gets form data with some helpful additions/shortcuts.
 * By default, all elements with a `name` attribute are used, regardless of being a valid form element.
 * Any elements with a `data-json` attribute will have this attribute parsed as JSON and used as its value.
 * If an element does not have a `value` attribute but has `innerText`, the `innerText` is used as its value.
 * The `value` attribute of checkboxes will be used if checked, empty string if not.
 * The `value` attribute of radio buttons will only be set if the radio button is selected.
 * You can include periods within elements names to create "deep" form data which matches the original object.
 * For example, <UI.Input name='foo.bar.baz' value={foo.bar.baz} /> will result in form data which looks like `{ foo: { bar: { baz } } }`.
 * @param {element} form - The form to get the data from.
 * @param {string} selector - The query selector used when obtaining the form's elements. Defaults to `[name]`.
 * @returns {object}
 */
export const getFormData = (form, selector = `[name]`) => {
  const elements = Array.prototype.slice.call(form.querySelectorAll(selector))
  const formData = {}

  for (let element of elements) {
    if (element.name) {
      if (element.getAttribute('data-json')) {
        try {
          getDeepObject(
            element.name,
            JSON.parse(element.getAttribute('data-json')),
            formData
          )
        } catch (error) {
        }
      } else if (!element.value && element.value !== `` && element.innerText) {
        getDeepObject(element.name, element.innerText, formData)
      } else if (element.type === 'checkbox') {
        getDeepObject(element.name, element.checked ? element.value : '', formData)
      } else if (element.type === 'radio') {
        if (element.checked) {
          getDeepObject(element.name, element.value, formData)
        }
      } else {
        getDeepObject(element.name, element.value, formData)
      }
    }
  }

  return formData
}

const Form = ({ onSubmit, onInput, getFormData, ...props }) => {
  const ref = React.createRef()

  return (
    <form
      ref={ref}

      onSubmit={event => {
        if (onSubmit) {
          onSubmit(event, getFormData(ref.current))
        }

        event.preventDefault()
        return false
      }}

      onInput={event => {
        if (onInput) {
          onInput(event, getFormData(ref.current))
        }
      }}

      { ...props }
    />
  )
}

Form.defaultProps = {
  getFormData
}

export default Form
