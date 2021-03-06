export type State = {
  cursor: Position;
  line: string;
  char: string;
  window: WindowState;
  words: PositionArrays;
  chunks: PositionArrays;
  matchPairs: string[];
  savedCol: number;
  lastRow: number;
  lastKeys: string;
  searchKeys: string;
};

export type Position = {
  row: number; // zero-based
  col: number; // zero-based
}

export type WindowState = {
  textoff: number;
  width: number;
  height: number;
  top: number; // zero-based
  bottom: number; // zero-based
}

// 0-indexed
export type PositionArrays = {
  starts: number[]; // zero-based
  ends: number[]; // zero-based
}
