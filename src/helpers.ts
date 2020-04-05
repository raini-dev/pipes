export type TMergeResult<P1, P2> = P1 extends Promise<infer U1>
  ? P2 extends Promise<infer U2>
    ? U1 & U2
    : U1 & P2
  : P2 extends Promise<infer U>
  ? P1 & U
  : P1 & P2

export function extend<T, K>(f: (x: T) => K): (x: T) => TMergeResult<T, K> {
  return function extendTo(x: T): TMergeResult<T, K> {
    return Array.isArray(x)
      ? (([...x, ...((f(x) as unknown) as any[])] as unknown) as TMergeResult<T, K>)
      : ({ ...x, ...f(x) } as TMergeResult<T, K>)
  }
}

export function tap<T, K>(f: (x: T) => K) {
  return function tapTo(x: T) {
    f(x)

    return x
  }
}
