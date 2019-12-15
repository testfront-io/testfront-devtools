import React from 'react'
import styled from 'styled-components'
import * as UI from '../../UI'
import * as Store from '../Store'
import * as Tests from '../Tests'
import Route from './Route'

// Customize the default UI.Form a bit.
export const Form = styled(UI.Form)`
  position: relative;
  margin: 0 auto;

  > footer {
    margin-bottom: 30px;
    text-align: center;

    > ${UI.Button} {
      padding: 5px 30px;
    }
  }
`

const Editor = () => {
  const [ autoFocusIndex, setAutoFocusIndex ] = React.useState(-1)

  return (
    <Store.Context.Consumer>
      {store => {
        const { editing, testing, data, error, set, setData } = store

        const updateRoute = ({ index, updates }) => setData(data => {
          const routes = [ ...data.routes ]
          routes[index] = { ...routes[index], ...updates }
          return { routes }
        })

        const deleteRoute = ({ index }) => setData(data => {
          const routes = [ ...data.routes ]
          routes.splice(index, 1)
          return { routes }
        })

        return (editing.routeIndex < 0 || !data.routes[editing.routeIndex]) ? (
          <Form>
            {data.routes.map((route, index) => {
              const autoFocus = autoFocusIndex === index

              if (autoFocus) {
                setAutoFocusIndex(-1)
              }

              return (
                <Route
                  key={`Route_${index}`}
                  testing={testing}
                  set={set}
                  setData={setData}
                  index={index}
                  route={route}
                  updateRoute={updateRoute}
                  deleteRoute={deleteRoute}
                  autoFocus={autoFocus}
                />
              )
            })}

            <footer>
              <UI.Button backgroundColor='green' onClick={() => setData(data => {
                const routes = [ ...data.routes ]

                routes.push({
                  path: `/`,
                  exact: false,
                  strict: false,
                  skip: false,
                  tests: []
                })

                setAutoFocusIndex(routes.length - 1)

                return { routes }
              })}>
                Add Route
              </UI.Button>

              <UI.Error>
                {error.routes || ``}
              </UI.Error>
            </footer>
          </Form>
        ) : (
          <Tests.Editor store={store} />
        )
      }}
    </Store.Context.Consumer>
  )
}

export default Editor
