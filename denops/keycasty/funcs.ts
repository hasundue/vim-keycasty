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

async function getMatchPairs(denops: Denops): Promise<string[]> {
  const str = await denops.eval("&mps") as string;
  return str.split(","); // something like ["(:)", "{:}", "[:]"]
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
  const matchPairs = await getMatchPairs(denops);

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
    matchPairs,
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

  // w W e E b B ge gE
  if (!verticalMove) {
    const positionss = [ current.wordStart, current.wordEnd, current.chunkStart, current.chunkEnd ];

    for (const positions of positionss) {
      const match = positions.indexOf(current.col - 1);

      if (match > -1) {
        const next = positions.findIndex(col => col > previous.col - 1);

        const jumpKey = ((positions: typeof positionss[number]) => { 
          if (match >= next) { // move forward
            switch (positions) {
              case current.wordStart: return "w";
              case current.chunkStart: return "W";
              case current.wordEnd: return "e";
              case current.chunkEnd: return "E";
            }
          }
          else { // move backward
            switch (positions) {
              case current.wordStart: return "b";
              case current.chunkStart: return "B";
              case current.wordEnd: return "ge";
              case current.chunkEnd: return "gE";
            }
          }
        })(positions);

        const jumpAmount = match >= next ? match - next + 1 : next - match - 1;

        candidates.push(amountChar(jumpAmount) + jumpKey);
      }
    }
  }

  // %
  const pairs = [ previous.char + ":" + current.char, current.char + ":" + previous.char ];
  for (const pair of pairs) {
    if (current.matchPairs.includes(pair)) {
      candidates.push("%");
    }
  }

  return candidates.reduce((now, next) => next.length < now.length ? next : now);
}

