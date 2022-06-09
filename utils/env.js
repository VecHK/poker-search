// tiny wrapper with default env vars

function setDefault(target, default_values) {
  Object.assign(
    target,
    ...Object.keys(default_values).map(key => {
      if (target[key] === undefined) {
        return { [key]: default_values[key] }
      } else {
        return {}
      }
    })
  )
}

setDefault(process.env, {
  DEBUG: 'DISABLE',
  NODE_ENV: 'development',
  PORT: 3000
})

module.exports = process.env;
