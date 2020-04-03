import { extend, tap } from "./helpers"

export class PromisePipeline<TCurrent, TNext, TReserved = TCurrent> {
  public static of<TCurrent, TNext>(
    f: (x: TCurrent) => TNext,
  ): PromisePipeline<
    TCurrent extends Promise<infer U> ? U : TCurrent,
    TNext extends Promise<infer U> ? U : TNext,
    TCurrent extends Promise<infer U> ? U : TCurrent
  > {
    if (typeof f != "function") {
      throw new TypeError("Argument must be a function.")
    }

    return new PromisePipeline([f])
  }

  public static from<TCurrent, TNext>(fs: Function[]): PromisePipeline<TCurrent, TNext, TCurrent> {
    fs.forEach((f) => {
      if (typeof f != "function") {
        throw new TypeError("Argument must only include functions.")
      }
    })

    return new PromisePipeline(fs)
  }

  public static empty<TCurrent, TNext = TCurrent, TReserved = TCurrent>(): PromisePipeline<
    TCurrent extends Promise<infer U> ? U : TCurrent,
    TNext extends Promise<infer U> ? U : TNext,
    TReserved extends Promise<infer U> ? U : TCurrent
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
  ): PromisePipeline<
    TNext extends Promise<infer U> ? U : TNext,
    TNext extends Promise<infer U> ? U : TNext,
    TReserved
  > {
    return PromisePipeline.from([...this.fs, f]) as PromisePipeline<
      TNext extends Promise<infer U> ? U : TNext,
      TNext extends Promise<infer U> ? U : TNext,
      TReserved
    >
  }

  public pipeTap<K>(
    f: (x: TCurrent) => K,
  ): PromisePipeline<
    TCurrent extends Promise<infer U> ? U : TCurrent,
    TCurrent extends Promise<infer U> ? U : TCurrent,
    TReserved
  > {
    return this.pipe(tap(f)) as PromisePipeline<
      TCurrent extends Promise<infer U> ? U : TCurrent,
      TCurrent extends Promise<infer U> ? U : TCurrent,
      TReserved
    >
  }

  public pipeExtend<TNext>(
    f: (x: TCurrent) => TNext,
  ): PromisePipeline<
    TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
    TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
    TReserved
  > {
    return this.pipe(extend(f)) as PromisePipeline<
      TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
      TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
      TReserved
    >
  }

  public concat<TOther extends PromisePipeline<TCurrent, TNext>>(
    o: TOther,
  ): PromisePipeline<
    TOther extends PromisePipeline<TCurrent, infer U> ? U : never,
    TNext extends Promise<infer U> ? U : TNext,
    TReserved
  > {
    return PromisePipeline.from(this.fs.concat(o.fs)) as PromisePipeline<
      TOther extends PromisePipeline<TCurrent, infer U> ? U : never,
      TNext extends Promise<infer U> ? U : TNext,
      TReserved
    >
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

export function pipeP<TCurrent, TNext = TCurrent, TReserved = TCurrent>(
  f: (x: TCurrent) => TNext,
): PromisePipeline<
  TCurrent extends Promise<infer U> ? U : TCurrent,
  TNext extends Promise<infer U> ? U : TNext,
  TReserved extends Promise<infer U> ? U : TCurrent
> {
  return (PromisePipeline.of(f) as unknown) as PromisePipeline<
    TCurrent extends Promise<infer U> ? U : TCurrent,
    TNext extends Promise<infer U> ? U : TNext,
    TReserved extends Promise<infer U> ? U : TCurrent
  >
}

export function pipeExtendP<TCurrent, TNext = TCurrent, TReserved = TCurrent>(
  f: (x: TCurrent) => TNext,
): PromisePipeline<
  TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
  TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
  TReserved
> {
  return PromisePipeline.empty<TCurrent>().pipeExtend(
    (f as unknown) as (x: TCurrent extends Promise<infer U> ? U : TCurrent) => TNext,
  ) as PromisePipeline<
    TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
    TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
    TReserved
  >
}
