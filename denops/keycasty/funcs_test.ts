import { assertEquals } from "https://deno.land/std@0.136.0/testing/asserts.ts";
import { getWordPosition } from "./funcs.ts";

Deno.test("getWordPosition 1", () => {
  const str = "  This is a test.";
  const { wordStart, wordEnd } = getWordPosition(str);
  assertEquals(wordStart, [2, 7, 10, 12])
  assertEquals(wordEnd, [5, 8, 10, 15, 16])
});

Deno.test("getWordPosition 2", () => {
  const str = "a:b::c;";
  const { wordStart, wordEnd } = getWordPosition(str);
  assertEquals(wordStart, [0, 1, 2, 3, 5])
  assertEquals(wordEnd, [0, 1, 2, 4, 5, 6])
});
