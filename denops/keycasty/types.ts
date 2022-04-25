export type State = {
  cursor: Position;
  char: string;
  window: WindowState;
  words: PositionArrays;
  chunks: PositionArrays;
  matchPairs: string[];
};

export type Position = {
  row: number; // zero-based
  col: number; // zero-based
}

export type WindowState = {
  width: number;
  height: number;
  topline: number; // zero-based
  botline: number; // zero-based
}

// 0-indexed
export type PositionArrays = {
  starts: number[]; // zero-based
  ends: number[]; // zero-based
}
