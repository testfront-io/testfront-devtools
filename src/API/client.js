import axios from 'axios'

const client = axios.create({
  baseURL: `http://localhost:3030/api`,
  timeout: 60000               // Requests will time out after 1 minute.
})

export default client
