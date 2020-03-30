import { SyncPipeline } from "./SyncPipeline";

const f = <T>(): T => ({} as any);
const id = <T>(x: T): T => x;

describe("SyncPipe", () => {
  describe("SyncPipeline.of", () => {
    it("should create an instance of SyncPipeline", () => {
      expect(SyncPipeline.of(() => {})).toBeInstanceOf(SyncPipeline);
    });

    it("should throw error if provided argument is not a function", () => {
      expect(() => SyncPipeline.of(undefined as any)).toThrow(TypeError);
    });
  });

  describe("SyncPipeline.from", () => {
    it("should create an instance of SyncPipeline", () => {
      expect(SyncPipeline.from([() => {}])).toBeInstanceOf(SyncPipeline);
    });

    it("should throw error if at least one item in the argument is not a function", () => {
      expect(() => SyncPipeline.from([() => {}, undefined as any])).toThrow(TypeError);
    });
  });

  describe("pipe", () => {
    it("should push the function to the array of internally stored functions", () => {
      expect(SyncPipeline.of(f).pipe(id).fs).toEqual([f, id]);
    });
  });

  describe("pipeTap", () => {
    it("should invoke the function and pass the argument along instead of the return value of that function", () => {
      const fn = jest.fn((_) => false);
      expect(
        SyncPipeline.empty()
          .pipeTap(fn)
          .process(() => null),
      ).toEqual(null);
      expect(fn).toHaveBeenCalledWith(null);
      expect(fn).toBeCalledTimes(1);
    });
  });

  describe("pipeExtend", () => {
    it("should extend context using extend helper", () => {
      expect(
        SyncPipeline.empty<{ test: string }>()
          .pipeExtend((x: { test: string }) => ({ TEST: x.test.toUpperCase() }))
          .process(() => ({ test: "test" })),
      ).toEqual({ test: "test", TEST: "TEST" });
    });
  });

  describe("concat", () => {
    const m = SyncPipeline.of(f);

    it("a.concat(b).concat(c) is equivalent to a.concat(b.concat(c)) (associativity)", () => {
      const g = <T>(): T => ({} as T);
      expect(m.concat(SyncPipeline.of(g).concat(SyncPipeline.of(id)))).toEqual(
        m.concat(SyncPipeline.of(g).concat(SyncPipeline.of(id))),
      );
    });

    it("m.concat(M.empty()) is equivalent to m (right identity)", () => {
      expect(m.concat(SyncPipeline.empty())).toEqual(m);
    });

    it("M.empty().concat(m) is equivalent to m (left identity)", () => {
      expect(SyncPipeline.empty().concat(m)).toEqual(m);
    });
  });

  describe("process", () => {
    it("should trigger execution of the Pipeline", () => {
      expect(
        SyncPipeline.empty<string>()
          .pipe((x) => x.toUpperCase())
          .process(() => "test"),
      ).toEqual("TEST");
    });
  });
});
