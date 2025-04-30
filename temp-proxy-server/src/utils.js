export const getResponseData = (data, error) => {
  const res = {
    data
  }

  if (error) {
    const err_code = error.code
    res.error = {
      code: err_code,
      message: error.message
    }
  }
  return res
}