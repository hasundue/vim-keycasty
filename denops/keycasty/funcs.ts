import type { Denops } from "./deps.ts";
import type { State } from "./types.ts";
import { vim } from "./deps.ts";

export async function getState(denops: Denops): Promise<State> {
  const position: vim.Position = await vim.getcurpos(denops);
  const line = await vim.getline(denops, ".");
  const col = await vim.col(denops, ".");

  return {
    row: position[1],
    col: position[2],
    char: line[col-1],
  };
}

export function getKeys(current: State, previous: State): string {
  let keys = "";

  if (current.row === previous.row) {
    const diff = current.col - previous.col;
    const diffAbs = Math.abs(diff);

    if (diffAbs > 1) {
      keys += diffAbs.toString();
    }

    keys += diff > 0 ? "l" : "h";
  }
  else {
    const diff = current.row - previous.row;
    const diffAbs = Math.abs(diff);

    if (diffAbs > 1) {
      keys += diffAbs.toString();
    }

    keys += diff > 0 ? "j" : "k";
  }

  return keys;
}

