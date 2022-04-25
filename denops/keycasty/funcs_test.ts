import { assertEquals } from "https://deno.land/std@0.136.0/testing/asserts.ts";
import { getWordPositions, getChunkPositions } from "./funcs.ts";

Deno.test("getWordPosition 1", () => {
  const str = "  This is a test.";
  const { starts, ends } = getWordPositions(str);
  assertEquals(starts, [2, 7, 10, 12])
  assertEquals(ends, [5, 8, 10, 15, 16])
});

Deno.test("getWordPosition 2", () => {
  const str = "a:b::c;";
  const { starts, ends } = getWordPositions(str);
  assertEquals(starts, [0, 1, 2, 3, 5])
  assertEquals(ends, [0, 1, 2, 4, 5, 6])
});

Deno.test("getChunkPosition", () => {
  const str = "This is a test.";
  const { starts, ends } = getChunkPositions(str);
  assertEquals(starts, [0, 5, 8, 10]);
  assertEquals(ends, [3, 6, 8, 14]);
});
