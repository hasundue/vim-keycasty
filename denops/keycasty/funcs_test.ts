import { assertEquals } from "https://deno.land/std@0.136.0/testing/asserts.ts";
import { getWordPositions, getChunkPositions } from "./funcs.ts";

Deno.test("getWordPosition 1", () => {
  const str = "This is a test.";
  const { starts, ends } = getWordPositions(str);
  assertEquals(starts, [0, 5, 8, 10])
  assertEquals(ends, [3, 6, 8, 13, 14])
});

Deno.test("getWordPosition 2", () => {
  const str = "a:b::c;";
  const { starts, ends } = getWordPositions(str);
  assertEquals(starts, [0, 1, 2, 3, 5, 6])
  assertEquals(ends, [0, 1, 2, 4, 5, 6])
});

Deno.test("getWordPosition 3", () => {
  const str = "# Test;";
  const { starts, ends } = getWordPositions(str);
  assertEquals(starts, [0, 2, 6])
  assertEquals(ends, [0, 5, 6])
});

Deno.test("getWordPosition 4", () => {
  const str = "# Tech Stacks";
  const { starts, ends } = getWordPositions(str);
  assertEquals(starts, [0, 2, 7])
  assertEquals(ends, [0, 5, 12])
});

Deno.test("getChunkPosition", () => {
  const str = "This is a test.";
  const { starts, ends } = getChunkPositions(str);
  assertEquals(starts, [0, 5, 8, 10]);
  assertEquals(ends, [3, 6, 8, 14]);
});
