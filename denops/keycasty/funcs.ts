import type { Denops } from "./deps.ts";
import type { State, WindowState, PositionArrays } from "./types.ts";
import { vim } from "./deps.ts";

function getPositionArrays(line: string, startPattern: RegExp, endPattern: RegExp): PositionArrays {
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

export function getWordPositions(line: string): PositionArrays {
  return getPositionArrays(
    line,
    /(?<=[\W\s]|^)\w|(?<=[\w\s]|^)[^\w\s\.,]/,
    /\w(?=[\W\s]|$)|[^\w\s](?=[\w\s]|$)/
  );
}

export function getChunkPositions(line: string): PositionArrays {
  return getPositionArrays(line, /(?<=\s|^)\S/, /\S(?=\s|$)/);
}

async function getMatchPairs(denops: Denops): Promise<string[]> {
  const str = await denops.eval("&mps") as string;
  return str.split(","); // something like ["(:)", "{:}", "[:]"]
}

export async function getWindowState(denops: Denops): Promise<WindowState> {
  const width = await vim.winwidth(denops, 0) as number;
  const winid = await vim.win_getid(denops);
  const wininfo = await vim.getwininfo(denops, winid) as Record<string, unknown>[];
  const textoff = wininfo[0].textoff as number;
  const topline = wininfo[0].topline as number;
  const botline = wininfo[0].botline as number;

  return {
    width: width - textoff,
    height: await vim.winheight(denops, 0) as number,
    top: topline - 1,
    bottom: botline - 1,
  }
}

export async function getState(denops: Denops, previous?: State): Promise<State> {
  const position: vim.Position = await vim.getcurpos(denops);
  const [ row, col ] = [ position[1] - 1, position[2] - 1 ];
  const line = await vim.getline(denops, ".");

  return {
    cursor: { row, col },
    char: line[col],
    window: await getWindowState(denops),
    words: getWordPositions(line),
    chunks: getChunkPositions(line),
    matchPairs: await getMatchPairs(denops),
    savedCol: !previous || col - previous.cursor.col ? col : previous.savedCol,
  };
}

const amountChar = (amount: number) => amount > 1 ? amount.toString() : "";

export function getKeysCursorMoved(current: State, previous: State): string {
  const candidates: string[] = [];

  const verticalMove = current.cursor.row - previous.cursor.row;
  const horizontalMove = current.cursor.col - previous.cursor.col;
  const windowWidth = current.window.width;

  // h j k l
  const simpleMoveKey = verticalMove
    ? ( verticalMove > 0 ? "j" : "k" )
    : ( horizontalMove > 0 ? "l" : "h" );

  const simpleMoveAmount = Math.abs(verticalMove) || Math.abs(horizontalMove);

  candidates.push(amountChar(simpleMoveAmount) + simpleMoveKey);

  // gj gk
  const visualVerticalMove = Math.floor(
    (horizontalMove + previous.cursor.col % windowWidth) / windowWidth
  );
  const visualVerticalMoveKey = visualVerticalMove > 0 ? "gj" : "gk";
  const visualVerticalMoveAmount = Math.abs(visualVerticalMove);

  if (visualVerticalMove) {
    candidates.push(amountChar(visualVerticalMoveAmount) + visualVerticalMoveKey);
  }

  // H M L
  if (verticalMove) {
    const textHeight = current.window.bottom - current.window.top + 1;

    if (current.cursor.row === current.window.top) {
      candidates.push("H");
    }
    if (current.cursor.row === current.window.bottom - Math.floor(textHeight/2)) {
      candidates.push("M");
    }
    if (current.cursor.row === current.window.bottom) {
      candidates.push("L");
    }
  }

  // w W e E b B ge gE
  if (!verticalMove) {
    const positionss = [ current.words.starts, current.words.ends, current.chunks.starts, current.chunks.ends ];

    for (const positions of positionss) {
      const match = positions.indexOf(current.cursor.col);

      if (match > -1) {
        const next = positions.findIndex(col => col > previous.cursor.col);
        const prev = positions.findLastIndex(col => col < previous.cursor.col);
        const isForward = next > 0 && match >= next

        const jumpKey = ((positions: typeof positionss[number]) => { 
          if (isForward) { // move forward
            switch (positions) {
              case current.words.starts: return "w";
              case current.chunks.starts: return "W";
              case current.words.ends: return "e";
              case current.chunks.ends: return "E";
            }
          }
          else { // move backward
            switch (positions) {
              case current.words.starts: return "b";
              case current.chunks.starts: return "B";
              case current.words.ends: return "ge";
              case current.chunks.ends: return "gE";
            }
          }
        })(positions);

        const jumpAmount = isForward ? match - next + 1 : prev - match + 1;

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

