import { assertEquals } from "https://deno.land/std@0.136.0/testing/asserts.ts";
import { getWordPosition } from "./funcs.ts";

Deno.test("getWordPosition", () => {
  const str = "  This is a test.";
  const { wordStart, wordEnd } = getWordPosition(str);
  assertEquals(wordStart, [2, 7, 10, 12])
  assertEquals(wordEnd, [5, 8, 10, 15])
});
