import randomString from './random-string'

export default function generateId() {
  return `${randomString(16, 0)}`
}
