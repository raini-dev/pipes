import { PromisePipeline, pipeP, pipeExtendP } from "./PromisePipeline"

const f = <T>(x: T): T => x
const id = <T>(x: T): T => x

describe("SyncPipe", () => {
  describe("PromisePipeline.of", () => {
    it("should create an instance of PromisePipeline", () => {
      expect(PromisePipeline.of(() => {})).toBeInstanceOf(PromisePipeline)
    })

    it("should throw error if provided argument is not a function", () => {
      expect(() => PromisePipeline.of(undefined as any)).toThrow(TypeError)
    })
  })

  describe("PromisePipeline.from", () => {
    it("should create an instance of PromisePipeline", () => {
      expect(PromisePipeline.from([() => {}])).toBeInstanceOf(PromisePipeline)
    })

    it("should throw error if at least one item in the argument is not a function", () => {
      expect(() => PromisePipeline.from([() => {}, undefined as any])).toThrow(TypeError)
    })
  })

  describe("pipe", () => {
    it("should push the function to the array of internally stored functions", () => {
      expect(PromisePipeline.of(f).pipe(id).fs).toEqual([f, id])
    })
  })

  describe("pipeTap", () => {
    it("should invoke the function and pass the argument along", async () => {
      const fn = jest.fn((_) => false)
      expect(
        await PromisePipeline.empty()
          .pipeTap(fn)
          .process(() => null),
      ).toEqual(null)
      expect(fn).toHaveBeenCalledWith(null)
      expect(fn).toBeCalledTimes(1)
    })
  })

  describe("pipeExtend", () => {
    it("should extend context using extend helper", async () => {
      expect(
        await PromisePipeline.empty<{ test: string }>()
          .pipeExtend((x: { test: string }) => ({ TEST: x.test.toUpperCase() }))
          .process(() => ({ test: "test" })),
      ).toEqual({ test: "test", TEST: "TEST" })
    })
  })

  describe("concat", () => {
    const m = PromisePipeline.of(f)

    it("a.concat(b).concat(c) is equivalent to a.concat(b.concat(c)) (associativity)", () => {
      const g = <T>(): T => ({} as T)
      expect(m.concat(PromisePipeline.of(g).concat(PromisePipeline.of(id)))).toEqual(
        m.concat(PromisePipeline.of(g).concat(PromisePipeline.of(id))),
      )
    })

    it("m.concat(M.empty()) is equivalent to m (right identity)", () => {
      expect(m.concat(PromisePipeline.empty())).toEqual(m)
    })

    it("M.empty().concat(m) is equivalent to m (left identity)", () => {
      expect(PromisePipeline.empty().concat(m)).toEqual(m)
    })
  })

  describe("process", () => {
    it("should trigger execution of the Pipeline", async () => {
      expect(
        await PromisePipeline.empty<string>()
          .pipe((x) => x.toUpperCase())
          .process(() => "test"),
      ).toEqual("TEST")
    })

    it("should stop processing on error", async () => {
      expect(
        await PromisePipeline.of(() => {
          throw new Error("message")
        })
          .process(() => {})
          .catch(id),
      )
    })
  })
})

describe("pipeP", () => {
  const f = Number

  it("should return a PromisePipeline", () => {
    expect(pipeP(f)).toBeInstanceOf(PromisePipeline)
  })

  it("should pipe the function provided as an argument", async () => {
    expect(await pipeP(f).process(() => "1")).toEqual(1)
  })
})

describe("pipeExtendP", () => {
  const f = ({ x }: { x: string }) => ({ y: x })

  it("should return a PromisePipeline", () => {
    expect(pipeExtendP(f)).toBeInstanceOf(PromisePipeline)
  })

  it("should pipeExtend the function provided as an argument", async () => {
    expect(await pipeExtendP(f).process(() => ({ x: "test" }))).toEqual({ x: "test", y: "test" })
  })
})
