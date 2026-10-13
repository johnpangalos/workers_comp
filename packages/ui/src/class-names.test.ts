import { bindClassNames } from "./class-names";

const cx = bindClassNames({ button: "wc-button-x1", active: "wc-active-x2" });

describe("bindClassNames", () => {
  it("maps module names to scoped classes and keeps the rest", () => {
    expect(cx("button", "rounded-full")).toBe("wc-button-x1 rounded-full");
  });

  it("splits space-separated strings", () => {
    expect(cx("button rounded-full px-6")).toBe("wc-button-x1 rounded-full px-6");
  });

  it("adds object keys whose values are truthy", () => {
    expect(cx({ button: true, active: false, "w-full": 1 })).toBe("wc-button-x1 w-full");
  });

  it("flattens arrays and skips falsy values", () => {
    expect(cx(["button", [null, "active"]], undefined, false, "")).toBe("wc-button-x1 wc-active-x2");
  });

  it("ignores names inherited from Object.prototype", () => {
    expect(cx("toString", "constructor")).toBe("toString constructor");
  });
});
