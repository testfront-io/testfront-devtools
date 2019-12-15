import React from 'react'
import styled from 'styled-components'
import octicons from 'octicons'
import * as UI from '../../UI'
import Test from './Test'
import { PathInput } from '../Routes/Route'

// Customize the default UI.Form a bit.
export const Form = styled(UI.Form)`
  position: relative;
  margin: 0 auto;

  > header {
    margin-bottom: 5px;

    > ${UI.Button} {
      margin-left: -5px;
      padding-left: 0;
      opacity: 0.5;
      transition: opacity 0.25s ease-in-out;

      > span {
        ~ span {
          margin-left: 0;
          margin-right: 0;
        }
      }

      &:hover {
        opacity: 1;
      }
    }
  }

  > center {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    font-size: 18px;
    padding-bottom: 15px;
    background: ${({ theme }) => theme.colors.background};

    > div {
      > div {
        margin-bottom: 5px;
      }

      > ${UI.Button} {
        height: 30px;
        padding: 7px;
        font-size: 18px;
        line-height: 20px;

        > span {
          height: 17px;
          line-height: 15px;

          + span {
            height: 15px;
          }
        }

        + ${UI.Button} {
          margin-left: 10px;
        }
      }
    }
  }

  > footer {
    margin-bottom: 30px;
    text-align: center;

    > ${UI.Button} {
      padding: 5px 30px;
    }
  }
`

const Editor = ({ store }) => {
  const { editing, recording, testing, data, error, set, setData } = store
  const [ autoFocusIndex, setAutoFocusIndex ] = React.useState(-1)
  const [ isDeleting, setIsDeleting ] = React.useState(false)

  const { routeIndex } = editing
  const route = data.routes[routeIndex]

  const updateRoute = ({ updates }) => setData(data => {
    const routes = [ ...data.routes ]
    routes[routeIndex] = { ...routes[routeIndex], ...updates }
    return { routes }
  })

  const deleteRoute = () => setData(data => {
    const routes = [ ...data.routes ]
    routes.splice(routeIndex, 1)
    return { routes }
  })

  const updateTest = ({ index, updates }) => setData(data => {
    const routes = [ ...data.routes ]
    const tests = [ ...routes[routeIndex].tests ]

    tests[index] = { ...tests[index], ...updates }
    routes[routeIndex] = { ...routes[routeIndex], tests }

    return { routes }
  })

  const deleteTest = ({ index }) => setData(data => {
    const routes = [ ...data.routes ]
    const tests = [ ...routes[routeIndex].tests ]

    tests.splice(index, 1)
    routes[routeIndex] = { ...routes[routeIndex], tests }

    return { routes }
  })

  return (
    <Form>
      <header>
        <UI.Button backgroundColor='transparent' onClick={() => set(store => ({ editing: { routeIndex: -1 } }))}>
          <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 20, height: 20 }) }} />
          <span>Back</span>
        </UI.Button>
      </header>

      <PathInput
        routeIndex={routeIndex}
        route={data.routes[routeIndex]}
        updateRoute={updateRoute}
        style={{ marginBottom: 45 }}
      />

      {isDeleting ? (
        <center>
          <div>
            <div>Delete this route and all of its tests?</div>

            <UI.Button backgroundColor='gray' onClick={() => {
              setIsDeleting(false)
            }}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`chevron-left`].toSVG({ width: 15, height: 15 }) }} />
              <span>Cancel</span>
            </UI.Button>

            <UI.Button backgroundColor='red' onClick={() => {
              setIsDeleting(false)
              set(store => ({ editing: { routeIndex: -1 } }))
              deleteRoute()
            }}>
              <span dangerouslySetInnerHTML={{ __html: octicons[`trashcan`].toSVG({ width: 15, height: 15 }) }} />
              <span>Delete</span>
            </UI.Button>
          </div>
        </center>
      ) : (
        <React.Fragment>
          {route.tests.map((test, index) => {
            const autoFocus = autoFocusIndex === index

            if (autoFocus) {
              setAutoFocusIndex(-1)
            }

            return (
              <Test
                key={`Test_${index}`}
                recording={recording}
                testing={testing}
                set={set}
                setData={setData}
                routeIndex={routeIndex}
                index={index}
                test={test}
                updateTest={updateTest}
                deleteTest={deleteTest}
                autoFocus={autoFocus}
              />
            )
          })}

          <footer>
            <UI.Button backgroundColor='green' onClick={() => setData(data => {
              const routes = [ ...data.routes ]
              const tests = [ ...routes[routeIndex].tests ]

              tests.push({
                description: ``,
                snapshotSelector: (tests[tests.length - 1] && tests[tests.length - 1].snapshotSelector) || `html`,
                eventTypes: [ `click`, `input`, `change` ],
                recorded: [],
                skip: false
              })

              routes[routeIndex] = { ...routes[routeIndex], tests }

              setAutoFocusIndex(tests.length - 1)

              return { routes }
            })}>
              <span>Add Test</span>
            </UI.Button>

            <UI.Error>
              {error.tests || ``}
            </UI.Error>
          </footer>
        </React.Fragment>
      )}
    </Form>
  )
}

export default Editor
