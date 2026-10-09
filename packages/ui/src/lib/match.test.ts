import { describe, expect, it } from "vitest";
import { match } from "./match";

describe("match", () => {
  it("returns the value for the key", () => {
    expect(match("sm" as "default" | "sm", { default: "a", sm: "b" })).toBe("b");
  });

  it("requires every key to be listed", () => {
    // @ts-expect-error "sm" is missing from the table
    match("sm" as "default" | "sm", { default: "a" });
  });
});
