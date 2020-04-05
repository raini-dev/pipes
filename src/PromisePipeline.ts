import { extend, tap, TMergeResult } from "./helpers"

export class PromisePipeline<TCurrent, TNext, TReserved = TCurrent> {
  public static of<TCurrent, TNext, TReserved = TCurrent>(
    f: (x: TCurrent) => TNext,
  ): PromisePipeline<TCurrent extends Promise<infer U> ? U : TCurrent, TNext, TReserved> {
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
    TCurrent extends Promise<infer U> ? U : TCurrent,
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

  public pipe<TNext>(f: (x: TCurrent) => TNext): PromisePipeline<TNext, TNext, TReserved> {
    return PromisePipeline.from([...this.fs, f])
  }

  public pipeTap<K>(f: (x: TCurrent) => K): PromisePipeline<TCurrent, TCurrent, TReserved> {
    return this.pipe(tap(f))
  }

  public pipeExtend<TNext>(
    f: (x: TCurrent) => TNext,
  ): PromisePipeline<TMergeResult<TCurrent, TNext>, TMergeResult<TCurrent, TNext>, TReserved> {
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

  public async process(f: () => TReserved): Promise<TNext> {
    let result: TNext = (f() as unknown) as TNext

    for (let i = 0; i < this._fs.length; i++) {
      result = await this._fs[i](result)
    }

    return result
  }
}

export function pipeP<TCurrent, TNext = TCurrent, TReserved = TCurrent>(f: (x: TCurrent) => TNext) {
  return PromisePipeline.of<TCurrent, TNext, TReserved>(f)
}

export function pipeExtendP<TCurrent, TNext = TCurrent, TReserved = TCurrent>(
  f: (x: TCurrent) => TNext,
): PromisePipeline<TMergeResult<TCurrent, TNext>, TMergeResult<TCurrent, TNext>, TReserved> {
  return PromisePipeline.empty<
    TMergeResult<TCurrent, TNext>,
    TMergeResult<TCurrent, TNext>,
    TReserved
  >().pipeExtend(f as any) as any
}
