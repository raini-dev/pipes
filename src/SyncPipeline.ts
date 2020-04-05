import { extend, tap, TMergeResult } from "./helpers"

export class SyncPipeline<TCurrent, TNext, TReserved = TCurrent> {
  public static of<TCurrent, TNext>(
    f: (x: TCurrent) => TNext,
  ): SyncPipeline<TCurrent, TNext, TCurrent> {
    if (typeof f != "function") {
      throw new TypeError("Argument must be a function.")
    }

    return new SyncPipeline([f])
  }

  public static from<TCurrent, TNext, TReserved = TCurrent>(
    fs: Function[],
  ): SyncPipeline<TCurrent, TNext, TReserved> {
    fs.forEach((f) => {
      if (typeof f != "function") {
        throw new TypeError("Argument must only include functions.")
      }
    })

    return new SyncPipeline(fs)
  }

  public static empty<TCurrent, TNext = TCurrent, TReserved = TCurrent>(): SyncPipeline<
    TCurrent,
    TNext,
    TReserved
  > {
    return new SyncPipeline([])
  }

  public static "fantasy-land/empty" = SyncPipeline.empty

  public get fs() {
    return this._fs
  }

  protected constructor(protected readonly _fs: Function[]) {}

  public pipe<TNext>(f: (x: TCurrent) => TNext): SyncPipeline<TNext, TNext, TReserved> {
    return SyncPipeline.from([...this.fs, f])
  }

  public pipeTap<K>(f: (x: TCurrent) => K): SyncPipeline<TCurrent, TCurrent, TReserved> {
    return this.pipe(tap(f))
  }

  public pipeExtend<TNext>(
    f: (x: TCurrent) => TNext,
  ): SyncPipeline<TMergeResult<TCurrent, TNext>, TMergeResult<TCurrent, TNext>, TReserved> {
    return this.pipe(extend(f))
  }

  public concat<TOther extends SyncPipeline<TCurrent, TNext>>(
    o: TOther,
  ): SyncPipeline<TOther extends SyncPipeline<TCurrent, infer U> ? U : never, TNext, TReserved> {
    return SyncPipeline.from(this.fs.concat(o.fs))
  }

  public "fantasy-land/concat" = this.concat

  public process(f: () => TReserved): TNext {
    return this._fs.reduce((acc, fn) => fn(acc), f() as unknown) as TNext
  }
}

export function pipe<TCurrent, TNext = TCurrent>(
  f: (x: TCurrent) => TNext,
): SyncPipeline<TCurrent, TNext, TCurrent> {
  return SyncPipeline.of(f)
}

export function pipeExtend<TCurrent, TNext = TCurrent, TReserved = TCurrent>(
  f: (x: TCurrent) => TNext,
) {
  return SyncPipeline.empty<
    TMergeResult<TCurrent, TNext>,
    TMergeResult<TCurrent, TNext>,
    TReserved
  >().pipeExtend(f as any)
}
