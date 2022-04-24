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

export function getKeysCursorMoved(current: State, previous: State): string {
  const candidates: string[] = [];

  const verticalMove = current.row - previous.row;
  const horizontalMove = current.col - previous.col;

  // h j k l
  const simpleMoveKey = verticalMove
    ? ( verticalMove > 0 ? "j" : "k" )
    : ( horizontalMove > 0 ? "l" : "h" );

  const simpleMoveAmount = Math.abs(verticalMove) || Math.abs(horizontalMove);
  const simpleMoveAmountChar = simpleMoveAmount > 1 ? simpleMoveAmount.toString() : "";

  candidates.push(simpleMoveAmountChar + simpleMoveKey);

  return candidates[0];
}

