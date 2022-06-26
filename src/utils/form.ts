export function getFormItem(formData: FormData, name: string) {
  const value = formData.get(name)
  if (value === null) {
    throw Error(`formData '${name}' value not found!`)
  } else if (typeof value !== 'string') {
    throw Error(`formData '${name}' value is not a string!`)
  } else {
    return value
  }
}

export function getFormCheckItem(formData: FormData, name: string): boolean {
  const value = formData.get(name)
  if ((value === null) || (typeof value === 'string')) {
    return value === 'on'
  } else {
    throw Error(`formData '${name}' value is not a string or null!`)
  }
}
