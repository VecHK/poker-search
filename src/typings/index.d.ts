declare module '*.svg' {
  const url: string
  export default url
}
declare module '*.png' {
  const url: string
  export default url
}
declare module '*.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module 'whatwg-mimetype' {
  class MIMETypeParameters {}

  class MIMEType {
    static parse(string: string): MIMEType | null
    get essence(): string
    get type(): string
    get subtype(): string
    set subtype(v: string): void
    get parameters(): MIMETypeParameters
    toString(): string
    isJavaScript({ prohibitParameters = false }: { prohibitParameters?: boolean }): boolean
    isXML(): boolean
    isHTML(): boolean
  }
  export default MIMEType
}

type Unpromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never;
