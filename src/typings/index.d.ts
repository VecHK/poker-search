declare module '*.svg' {
  const url: string
  export default url
}
declare module '*.css' {
  const classes: { [key: string]: string }
  export default classes
}

type Unpromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never;
