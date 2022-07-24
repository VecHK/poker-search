import React from 'react'

export default function Failure({ error }: { error: Error }) {
  return (
    <div className="failure">
      <h1>错误</h1>
      <code><pre>{error.message}</pre></code>
      <code><pre>{error.stack}</pre></code>
    </div>
  )
}
