import type { Denops } from "./deps.ts";
import type { State } from "./types.ts";
import { vim } from "./deps.ts";

export async function getState(denops: Denops): Promise<State> {
  const position: vim.Position = await vim.getcurpos(denops);

  const line = await vim.getline(denops, ".");
  const col = await vim.col(denops, ".");

  const width = await vim.winwidth(denops, 0) as number;
  const height = await vim.winheight(denops, 0) as number;

  const winid = await vim.win_getid(denops);
  const wininfo = await vim.getwininfo(denops, winid) as Record<string, unknown>[];
  const textoff = wininfo[0].textoff as number;
  const topline = wininfo[0].topline as number;
  const botline = wininfo[0].botline as number;

  return {
    row: position[1],
    col: position[2],
    char: line[col-1],
    width: width - textoff,
    height,
    topline,
    botline,
  };
}

export function getKeysCursorMoved(current: State, previous: State): string {
  const candidates: string[] = [];

  const verticalMove = current.row - previous.row;
  const horizontalMove = current.col - previous.col;
  const windowWidth = current.width;
  const windowHeight = current.height;

  const moveAmountChar = (amount: number) => amount > 1 ? amount.toString() : "";

  // h j k l
  const simpleMoveKey = verticalMove
    ? ( verticalMove > 0 ? "j" : "k" )
    : ( horizontalMove > 0 ? "l" : "h" );

  const simpleMoveAmount = Math.abs(verticalMove) || Math.abs(horizontalMove);
  const simpleMoveAmountChar = simpleMoveAmount > 1 ? simpleMoveAmount.toString() : "";

  candidates.push(simpleMoveAmountChar + simpleMoveKey);

  // gj gk
  const visualVerticalMove = Math.floor(
    (horizontalMove + previous.col % windowWidth) / windowWidth
  );
  const visualVerticalMoveKey = visualVerticalMove > 0 ? "gj" : "gk";
  const visualVerticalMoveAmount = Math.abs(visualVerticalMove);

  if (visualVerticalMove) {
    candidates.push(moveAmountChar(visualVerticalMoveAmount) + visualVerticalMoveKey);
  }

  // H M L
  if (current.row === previous.topline) {
    candidates.push("H");
  }
  if (current.row === previous.botline - Math.floor(windowHeight/2)) {
    candidates.push("M");
  }
  if (current.row === previous.botline) {
    candidates.push("L");
  }

  return candidates.reduce((now, next) => next.length < now.length ? next : now);
}

