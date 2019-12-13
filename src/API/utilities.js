export const getErrorMessage = error => (
  (error
    && error.response
    && error.response.data
    && (error.response.data.error || (error.response.data.errors && Object.keys(error.response.data.errors).map(key => `${key} ${error.response.data.errors[key]}`).join(` `)))
  ) || `${error}`
)
