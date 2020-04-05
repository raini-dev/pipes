import { extend, tap, TUnwrap } from "./helpers"

export class PromisePipeline<TCurrent, TNext, TReserved = TCurrent> {
  public static of<TCurrent, TNext, TReserved = TCurrent>(
    f: (x: TCurrent) => TNext,
  ): PromisePipeline<TCurrent, TNext, TReserved> {
    if (typeof f != "function") {
      throw new TypeError("Argument must be a function.")
    }

    return new PromisePipeline([f])
  }

  public static from<TCurrent, TNext, TReserved = TCurrent>(
    fs: Function[],
  ): PromisePipeline<TCurrent, TNext, TReserved> {
    fs.forEach((f) => {
      if (typeof f != "function") {
        throw new TypeError("Argument must only include functions.")
      }
    })

    return new PromisePipeline(fs)
  }

  public static empty<TCurrent, TNext = TCurrent, TReserved = TCurrent>(): PromisePipeline<
    TUnwrap<Promise<TCurrent>>,
    TNext,
    TReserved
  > {
    return new PromisePipeline([])
  }

  public get fs() {
    return this._fs
  }

  public static "fantasy-land/empty" = PromisePipeline.empty

  protected constructor(protected readonly _fs: Function[]) {}

  public pipe<TNext>(
    f: (x: TCurrent) => TNext,
  ): PromisePipeline<TUnwrap<TNext>, TUnwrap<TNext>, TReserved> {
    return PromisePipeline.from([...this.fs, f])
  }

  public pipeTap<K>(
    f: (x: TCurrent) => K,
  ): PromisePipeline<TUnwrap<TCurrent>, TUnwrap<TCurrent>, TReserved> {
    return this.pipe(tap(f))
  }

  public pipeExtend<TNext>(
    f: (x: TCurrent) => TNext,
  ): PromisePipeline<
    TUnwrap<TCurrent> & TUnwrap<TNext>,
    TUnwrap<TCurrent> & TUnwrap<TNext>,
    TReserved
  > {
    return this.pipe(extend(f))
  }

  public concat<TOther extends PromisePipeline<TCurrent, TNext>>(
    o: TOther,
  ): PromisePipeline<
    TOther extends PromisePipeline<TCurrent, infer U>
      ? U extends Promise<infer G>
        ? G
        : U
      : never,
    TNext,
    TReserved
  > {
    return PromisePipeline.from(this.fs.concat(o.fs))
  }

  public "fantasy-land/concat" = this.concat

  public async process(thunk: () => TReserved | Promise<TReserved>): Promise<TNext> {
    let result: TNext = ((await thunk()) as unknown) as TNext

    for (let i = 0; i < this._fs.length; i++) {
      result = await this._fs[i](result)
    }

    return result
  }
}

export function pipeP<TCurrent, TNext = TCurrent, TReserved = TCurrent>(
  f: (x: TCurrent) => TUnwrap<TNext>,
) {
  return PromisePipeline.empty<TCurrent, TNext, TReserved>().pipe(f)
}

export function pipeTapP<TCurrent, TNext = TCurrent, TReserved = TCurrent>(
  f: (x: TCurrent) => TUnwrap<TNext>,
) {
  return PromisePipeline.empty<TCurrent, TCurrent, TReserved>().pipeTap(f)
}

export function pipeExtendP<TCurrent, TNext = TCurrent, TReserved = TCurrent>(
  f: (x: TCurrent) => TNext,
) {
  return PromisePipeline.empty<
    TUnwrap<TCurrent> & TUnwrap<TNext>,
    TUnwrap<TCurrent> & TUnwrap<TNext>,
    TReserved
  >().pipeExtend(f as any)
}
