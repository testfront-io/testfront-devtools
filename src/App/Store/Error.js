import React from 'react'
import styled from 'styled-components'
import * as UI from '../../UI'

// TODO it's possible for an error to be caused by something other than the server not running
const Error = styled(({ store, ...props }) => {
  return (
    <UI.Form { ...props }>
      <p>
        <UI.Input
          placeholder='Server Base URL'
          value={store.config.serverBaseURL}
          onBlur={event => {
            const serverBaseURL = event.target.value

            if (store.config.serverBaseURL !== serverBaseURL) {
              store.updateStore(store => ({
                config: {
                  ...store.config,
                  serverBaseURL
                }
              }))

              store.saveData()
            }
          }}
        />
      </p>

      <p>
        It looks like the <a href='https://www.npmjs.com/package/testfront-cli#devtools-server' target='_blank' rel='noopener noreferrer'>TestFront DevTools Server</a> isn't running.
      </p>

      <p>
        Add <pre>testfront-cli</pre> to your project with NPM:

        <div>
          <pre>npm i testfront-cli --save-dev</pre>
        </div>
      </p>

      <p>
        Run the server with:

        <div>
          <pre>npm run testfront devtools-server</pre>
        </div>
      </p>

      <p>
        The server will create its own directory within your project which should be committed as you solidify your tests.
      </p>

      <center>
        <UI.Button onClick={() => store.fetchData()}>
          Try Server Again
        </UI.Button>
      </center>

      <p style={{ marginTop: 60 }}>
        Alternatively, you can use this extension's local storage.
      </p>

      <center>
        <UI.Button onClick={() => {
          store.updateStore(store => ({
            config: {
              ...store.config,
              source: `local`
            }
          }))

          store.saveData()
        }}>
          Use Local Storage
        </UI.Button>
      </center>
    </UI.Form>
  )
})`
  width: 400px;
  max-width: 100%;
  margin: 0 auto;
  font-size: 15px;
  text-align: center;

  > p {
    > ${UI.Input} {
      width: 100%;
    }

    pre {
      display: inline-block;
      margin: 0 auto;
      padding: 0;
      background: rgba(0, 0, 0, 0.25);
      color: rgba(255, 255, 255, 0.9);
      cursor: pointer;

      &:hover {
        background: rgba(0, 0, 0, 0.5);
        color: white;
      }
    }

    > div {
      margin-top: 5px;

      > pre {
        padding: 5px;
      }
    }
  }

  > center {
    margin: 10px 0;
  }
`

export default Error
