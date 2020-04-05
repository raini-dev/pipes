export type TUnwrap<X> = X extends Promise<infer U> ? U : X

export function extend<T, K>(f: (x: T) => K) {
  return function extendTo(x: T): T & K {
    return Array.isArray(x)
      ? (([...x, ...((f(x) as unknown) as any[])] as unknown) as T & K)
      : ({ ...x, ...f(x) } as T & K)
  }
}

export function tap<T, K>(f: (x: T) => K) {
  return function tapTo(x: T) {
    f(x)

    return x
  }
}
