import { extend, tap } from "./helpers";

export class PromisePipeline<TCurrent, TNext, TReserved = TCurrent> {
  public static of<TCurrent, TNext>(
    f: (x: TCurrent) => TNext,
  ): PromisePipeline<
    TCurrent extends Promise<infer U> ? U : TCurrent,
    TNext extends Promise<infer U> ? U : TNext,
    TCurrent extends Promise<infer U> ? U : TCurrent
  > {
    if (typeof f != "function") {
      throw new TypeError("Argument must be a function.");
    }

    return new PromisePipeline([f]);
  }

  public static from<TCurrent, TNext>(fs: Function[]): PromisePipeline<TCurrent, TNext, TCurrent> {
    fs.forEach((f) => {
      if (typeof f != "function") {
        throw new TypeError("Argument must only include functions.");
      }
    });

    return new PromisePipeline(fs);
  }

  public static empty<TCurrent, TNext = TCurrent, TReserved = TCurrent>(): PromisePipeline<
    TCurrent,
    TNext,
    TReserved
  > {
    return new PromisePipeline([]);
  }

  public get fs() {
    return this._fs;
  }

  protected constructor(protected readonly _fs: Function[]) {}

  public pipe<TNext>(
    f: (x: TCurrent) => TNext,
  ): PromisePipeline<
    TNext extends Promise<infer U> ? U : TNext,
    TNext extends Promise<infer U> ? U : TNext,
    TReserved
  > {
    return PromisePipeline.from([...this.fs, f]) as any;
  }

  public pipeTap(
    f: (x: TCurrent) => any,
  ): PromisePipeline<
    TCurrent extends Promise<infer U> ? U : TCurrent,
    TCurrent extends Promise<infer U> ? U : TCurrent,
    TReserved
  > {
    return this.pipe(tap(f)) as any;
  }

  public pipeExtend<TNext>(
    f: (x: TCurrent) => TNext,
  ): PromisePipeline<
    TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
    TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
    TReserved
  > {
    return this.pipe(extend(f)) as any;
  }

  public concat<TOther extends PromisePipeline<TCurrent, TNext>>(
    o: TOther,
  ): PromisePipeline<
    TOther extends PromisePipeline<TCurrent, infer U> ? U : never,
    TNext extends Promise<infer U> ? U : TNext,
    TReserved
  > {
    return PromisePipeline.from(this.fs.concat(o.fs)) as any;
  }

  public async process(f: () => TReserved): Promise<TNext> {
    let result: any = f();

    for (let i = 0; i < this._fs.length; i++) {
      result = await this._fs[i](result);
    }

    return result;
  }
}

export function pipeP<TCurrent, TNext = TCurrent>(
  f: (x: TCurrent) => TNext,
): PromisePipeline<
  TCurrent extends Promise<infer U> ? U : TCurrent,
  TNext extends Promise<infer U> ? U : TNext,
  TCurrent extends Promise<infer U> ? U : TCurrent
> {
  return PromisePipeline.of(f);
}

export function pipeExtendP<TCurrent, TNext = TCurrent>(
  f: (x: TCurrent) => TNext,
): PromisePipeline<
  TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
  TCurrent extends Promise<infer U> ? U : TCurrent & TNext extends Promise<infer U> ? U : TNext,
  TCurrent
> {
  return PromisePipeline.empty<TCurrent, TCurrent & TNext>().pipeExtend(f);
}
