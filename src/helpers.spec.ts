import { extend, tap } from "./helpers"

describe("helpers", () => {
  describe("extend", () => {
    it("should extend the object provided last with the result of the computation of the function provided first", () => {
      expect(extend(() => ({ success: true }))({ test: "test" })).toEqual({
        test: "test",
        success: true,
      })
    })

    it("should work with arrays", () => {
      expect(extend(() => ["foo"])(["bar"])).toEqual(["bar", "foo"])
    })
  })

  describe("tap", () => {
    it("should call the function provided first with the argument provided last and return the argument", () => {
      const fn = jest.fn((_) => false)

      expect(tap(fn)("test")).toEqual("test")
      expect(fn).toBeCalledWith("test")
      expect(fn).toBeCalledTimes(1)
    })
  })
})
