import { extend, tap } from "./helpers";

// export interface IPipe<TProcess, TCurrent> {
//   map<TNext>(
//     f: (x: TCurrent) => TNext
//   ): IPipe<TProcess, TNext extends Promise<infer P> ? P : TNext>;
//   fs: Array<Function>;
//   process: TProcess;
// }

// export interface ISyncPipe<TCurrent, TNext, TReserved>
//   extends IPipe<(f: () => TReserved) => TNext, TCurrent> {
//   process(f: () => TReserved): TNext;
// }

export class SyncPipeline<TCurrent, TNext, TReserved = TCurrent> {
  public static of<TCurrent, TNext>(
    f: (x: TCurrent) => TNext,
  ): SyncPipeline<TCurrent, TNext, TCurrent> {
    if (typeof f != "function") {
      throw new TypeError("Argument must be a function.");
    }

    return new SyncPipeline([f]);
  }

  public static from<TCurrent, TNext>(fs: Function[]): SyncPipeline<TCurrent, TNext, TCurrent> {
    fs.forEach((f) => {
      if (typeof f != "function") {
        throw new TypeError("Argument must only include functions.");
      }
    });

    return new SyncPipeline(fs);
  }

  public static empty<TCurrent, TNext = TCurrent, TReserved = TCurrent>(): SyncPipeline<
    TCurrent,
    TNext,
    TReserved
  > {
    return new SyncPipeline([]);
  }

  public get fs() {
    return this._fs;
  }

  protected constructor(protected readonly _fs: Function[]) {}

  public pipe<TNext>(f: (x: TCurrent) => TNext): SyncPipeline<TNext, TNext, TReserved> {
    return SyncPipeline.from([...this.fs, f]) as any;
  }

  public pipeTap(f: (x: TCurrent) => any): SyncPipeline<TCurrent, TCurrent, TReserved> {
    return this.pipe(tap(f)) as any;
  }

  public pipeExtend<TNext>(
    f: (x: TCurrent) => TNext,
  ): SyncPipeline<TCurrent & TNext, TCurrent & TNext, TReserved> {
    return this.pipe(extend(f)) as any;
  }

  public concat<TOther extends SyncPipeline<TCurrent, TNext>>(
    o: TOther,
  ): SyncPipeline<TOther extends SyncPipeline<TCurrent, infer U> ? U : never, TNext, TReserved> {
    return SyncPipeline.from(this.fs.concat(o.fs)) as any;
  }

  public process(f: () => TReserved): TNext {
    return this._fs.reduce((acc, fn) => fn(acc), f() as any);
  }
}
