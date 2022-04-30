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

    const end = line.slice(index).search(endPattern);

    if (end > -1) {
      index += end;
      ends.push(index);
    }

    index += 1;
  }
  
  if (!line.length) {
    starts.push(0);
    ends.push(0);
  }

  return { starts, ends };
}

export function getWordPositions(line: string): PositionArrays {
  return getPositionArrays(
    line,
    /(?<=[\W\s]|^)\w|(?<=[\w\s]|^)[^\w\s]/,
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
  const eof = await vim.getpos(denops, "$");

  return {
    cursor: { row, col },
    line,
    char: line[col],
    window: await getWindowState(denops),
    words: getWordPositions(line),
    chunks: getChunkPositions(line),
    matchPairs: await getMatchPairs(denops),
    savedCol: previous?.savedCol ?? col,
    lastRow: eof[1] - 1,
    lastKeys: previous?.lastKeys ?? "",
    searchKeys: previous?.searchKeys ?? "",
  };
}

const amountChar = (amount: number) => amount > 1 ? amount.toString() : "";

export async function getKeysCursorMoved(denops: Denops, current: State, previous: State) {
  const candidates: string[] = [];

  const verticalMove = current.cursor.row - previous.cursor.row;
  const horizontalMove = current.cursor.col - previous.cursor.col;
  const windowWidth = current.window.width;

  const simpleVerticalMove = verticalMove && 
    (!horizontalMove ||
     current.cursor.col === current.savedCol ||
     !current.chunks.ends.length ||
     current.cursor.col < current.savedCol && current.cursor.col === current.chunks.ends.reverse()[0]);

  // h j k l
  const simpleMoveKey = verticalMove
    ? ( verticalMove > 0 ? "j" : "k" )
    : ( horizontalMove > 0 ? "l" : "h" );

  const simpleMoveAmount = Math.abs(verticalMove) || Math.abs(horizontalMove);

  if (simpleVerticalMove || horizontalMove && !verticalMove) {
    candidates.push(amountChar(simpleMoveAmount) + simpleMoveKey);
  }

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
  if (simpleVerticalMove) {
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
  for (const kind of ["words", "chunks"] as const) {
    for (const edge of ["starts", "ends"] as const) {
      let match = current[kind][edge].indexOf(current.cursor.col);

      if (match > -1) {
        let next = previous[kind][edge].findIndex(col => col > previous.cursor.col);
        if (next < 0) next = previous[kind][edge].length;

        let prev = previous[kind][edge].findLastIndex(col => col < previous.cursor.col);
        if (prev < 0) prev = -1;

        if (verticalMove > 0) match += previous[kind][edge].length;
        if (verticalMove < 0) match -= current[kind][edge].length;

        const isForward = verticalMove >= 0 && match >= next;

        const jumpKey = (() => { 
          switch (current[kind][edge]) {
            case current.words.starts: return isForward ? "w" : "b";
            case current.chunks.starts: return isForward ? "W" : "B";
            case current.words.ends: return isForward ? "e" : "ge";
            case current.chunks.ends: return isForward ? "E" : "gE";
          }})();

        let jumpAmount = isForward ? match - next + 1 : prev - match + 1;

        if (Math.abs(verticalMove) > 1) {
          const min = Math.min(current.cursor.row, previous.cursor.row);
          const max = Math.max(current.cursor.row, previous.cursor.row);
          const getKindPositions = kind === "words" ? getWordPositions : getChunkPositions;

          for (let lnum = min+1; lnum < max; lnum++) {
            const line = await vim.getline(denops, lnum+1);
            if (!line.length && (jumpKey! === "e" || jumpKey! === "E")) continue;
            jumpAmount += getKindPositions(line)[edge].length;
          }
        }

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

  // 0 ^ $ g_
  if (!verticalMove) {
    switch (current.cursor.col) {
      case 0: candidates.push("0"); /* falls through */
      case current.chunks.starts[0]: candidates.push("^"); /* falls through */
      case current.line.length - 1: candidates.push("$"); /* falls through */
      case current.chunks.ends.reverse()[0]: candidates.push("g_"); /* falls through */
    }
  }

  // gg G
  if (simpleVerticalMove) {
    switch (current.cursor.row) {
      case 0: 
        candidates.push("gg");
        break;
      case current.lastRow:
        candidates.push("G");
        break;
      default: 
        candidates.push((current.cursor.row + 1).toString() + "G");
    }
  }

  // fx tx Fx Tx ; ,
  if (!verticalMove) {
    const forwards = current.cursor.col > previous.cursor.col;

    const moves: { [ key: string ]: [ number, boolean ] } = { 
      "f": [ 0, false ],
      "F": [ 0, true ],
      "t": [ +1, false ],
      "T": [ -1, true ],
    };

    for (const [ key, [ offset, backwards ] ] of Object.entries(moves)) {
      if (forwards && backwards) continue;

      const char = current.line[current.cursor.col + offset];
      if (!char) continue;

      const partialLine = forwards
        ? current.line.slice(previous.cursor.col + 1, current.cursor.col)
        : current.line.slice(current.cursor.col + 1, previous.cursor.col);

      const count = (partialLine.match(new RegExp(char, "g")) || []).length;

      if (previous.searchKeys.match(new RegExp("\d*?[fFtT]" + char))) {
        candidates.push(amountChar(count+1) + (forwards ? ";" : ","));
      }
      else {
        candidates.push(amountChar(count+1) + key + char);
      }
    }
  }

  let keys = candidates.find(keys => keys === previous.lastKeys); 

  if (!keys) {
    keys = candidates.length
      ? candidates.reduce((now, next) => next.length < now.length ? next : now)
      : "";
  }

  current.lastKeys = keys;

  const simpleVerticalKeys = ["j", "k", "H", "M", "L"];
  if (!simpleVerticalKeys.some(key => keys!.includes(key))) {
    current.savedCol = current.cursor.col;
  }

  if (keys!.match(/\d*?[fFtT]./)) {
    current.searchKeys = keys;
  }

  return keys;
}

