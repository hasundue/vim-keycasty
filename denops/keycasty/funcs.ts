import type { Denops } from "./deps.ts";
import type { State } from "./types.ts";
import { vim } from "./deps.ts";

function getObjectPositions(line: string, startPattern: RegExp, endPattern: RegExp)
: { starts: number[], ends: number[] } {
  const starts: number[] = [];
  const ends: number[] = [];

  let index = 0;

  while (true) {
    if (index === line.length) break;

    const start = line.slice(index).search(startPattern);

    if (start > -1) {
      index += start;
      starts.push(index);
    }

    index += line.slice(index).search(endPattern);
    ends.push(index);

    index += 1;
  }

  return { starts, ends };
}

export function getWordPositions(line: string): { starts: number[], ends: number[] } {
  return getObjectPositions(
    line,
    /\b\w|((?<=[\w\s])[^\w\s\.,]|^[^\w\s\.,])./,
    /\w\b|[^\w\s][\w\s]|[^\w\s]$/
  );
}

export function getChunkPositions(line: string): { starts: number[], ends: number[] } {
  return getObjectPositions(line, /(?<=\s|^)\S/, /\S(?=\s|$)/);
}

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

  const wordPositions = getWordPositions(line);
  const chunkPositions = getChunkPositions(line);

  return {
    row: position[1],
    col: position[2],
    char: line[col-1],
    width: width - textoff,
    height,
    topline,
    botline,
    wordStart: wordPositions.starts,
    wordEnd: wordPositions.ends,
    chunkStart: chunkPositions.starts,
    chunkEnd: chunkPositions.ends,
  };
}

const amountChar = (amount: number) => amount > 1 ? amount.toString() : "";

export function getKeysCursorMoved(current: State, previous: State): string {
  const candidates: string[] = [];

  const verticalMove = current.row - previous.row;
  const horizontalMove = current.col - previous.col;
  const windowWidth = current.width;
  const windowHeight = current.height;

  // h j k l
  const simpleMoveKey = verticalMove
    ? ( verticalMove > 0 ? "j" : "k" )
    : ( horizontalMove > 0 ? "l" : "h" );

  const simpleMoveAmount = Math.abs(verticalMove) || Math.abs(horizontalMove);

  candidates.push(amountChar(simpleMoveAmount) + simpleMoveKey);

  // gj gk
  const visualVerticalMove = Math.floor(
    (horizontalMove + previous.col % windowWidth) / windowWidth
  );
  const visualVerticalMoveKey = visualVerticalMove > 0 ? "gj" : "gk";
  const visualVerticalMoveAmount = Math.abs(visualVerticalMove);

  if (visualVerticalMove) {
    candidates.push(amountChar(visualVerticalMoveAmount) + visualVerticalMoveKey);
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

  // w e b ge
  if (!verticalMove) {
    const matchedStart = current.wordStart.indexOf(current.col - 1);
    const matchedEnd = current.wordEnd.indexOf(current.col - 1);
    if (matchedStart > -1) {
      const nextStart = previous.wordStart.findIndex(col => col > previous.col - 1);
      const jumpKey = matchedStart >= nextStart ? "w" : "b";
      const jumpAmount = matchedStart >= nextStart
        ? matchedStart - nextStart + 1
        : nextStart - matchedStart - 1;
      candidates.push(amountChar(jumpAmount) + jumpKey);
    }
    if (matchedEnd > -1) {
      const nextEnd = previous.wordEnd.findIndex(col => col > previous.col - 1);
      const jumpKey = matchedEnd >= nextEnd ? "e" : "ge";
      const jumpAmount = matchedEnd >= nextEnd
        ? matchedEnd - nextEnd + 1
        : nextEnd - matchedEnd - 1;
      candidates.push(amountChar(jumpAmount) + jumpKey);
    }
  }

  // W E B gE
  if (!verticalMove) {
    const matchedStart = current.chunkStart.indexOf(current.col - 1);
    const matchedEnd = current.chunkEnd.indexOf(current.col - 1);
    if (matchedStart > -1) {
      const nextStart = previous.chunkStart.findIndex(col => col > previous.col - 1);
      const jumpKey = matchedStart >= nextStart ? "W" : "B";
      const jumpAmount = matchedStart >= nextStart
        ? matchedStart - nextStart + 1
        : nextStart - matchedStart - 1;
      candidates.push(amountChar(jumpAmount) + jumpKey);
    }
    if (matchedEnd > -1) {
      const nextEnd = previous.chunkEnd.findIndex(col => col > previous.col - 1);
      const jumpKey = matchedEnd >= nextEnd ? "E" : "gE";
      const jumpAmount = matchedEnd >= nextEnd
        ? matchedEnd - nextEnd + 1
        : nextEnd - matchedEnd - 1;
      candidates.push(amountChar(jumpAmount) + jumpKey);
    }
  }

  return candidates.reduce((now, next) => next.length < now.length ? next : now);
}

