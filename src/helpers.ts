export function extend<T, K extends Record<string, any>>(f: (x: T) => K) {
  return function extendTo(x: T) {
    return Array.isArray(x) ? [...x, ...(f(x) as any)] : { ...x, ...f(x) };
  };
}

export function tap<T>(f: (x: T) => any) {
  return function tapTo(x: T) {
    f(x);

    return x;
  };
}
