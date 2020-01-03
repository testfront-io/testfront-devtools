import axios from 'axios'

const client = axios.create({
  baseURL: `http://localhost:3030`,
  timeout: 2000 // If `devtools-server` is running, 2 seconds should be plenty.
})

export default client
