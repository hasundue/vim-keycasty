import { assertEquals } from "https://deno.land/std@0.136.0/testing/asserts.ts";
import { getWordPositions, getChunkPositions } from "./funcs.ts";

const tests = [
  {
    str: "This is a test. ",
    words: {
      starts: [0, 5, 8, 10, 14],
      ends: [3, 6, 8, 13, 14],
    },
    chunks: {
      starts: [0, 5, 8, 10],
      ends: [3, 6, 8, 14],
    },
  }
];

Deno.test("getWordPosition", async (t) => {
  for (const test of tests) {
    const index = tests.indexOf(test);

    await t.step(`case ${index + 1}: "${test.str}"`, () => {
      const { starts, ends } = getWordPositions(test.str);
      assertEquals(starts, test.words.starts);
      assertEquals(ends, test.words.ends);
    });
  }
});

Deno.test("getChunkPosition", async (t) => {
  for (const test of tests) {
    const index = tests.indexOf(test);

    await t.step(`case ${index + 1}: "${test.str}"`, () => {
      const { starts, ends } = getChunkPositions(test.str);
      assertEquals(starts, test.chunks.starts);
      assertEquals(ends, test.chunks.ends);
    });
  }
});
