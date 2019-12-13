import React from 'react'
import * as API from '../../API'
import Context from './Context'

export const fetchSession = async ({ setSession }) => {
  try {
    const { data } = await API.client.post(`users/session`)

    // Valid response data will include a session object.
    const { session } = data

    if (session) {
      setSession(session)
    } else {
      throw new Error(`Invalid authorization.`)
    }
  } catch (error) {
    setSession({})
  }
}

const Provider = ({ children }) => {
  const [ session ] = React.useState({})

  if (!session.user) {
    // TODO fetchSession({ setSession })
  }

  return (
    <Context.Provider value={session}>
      {children}
    </Context.Provider>
  )
}

export default Provider
