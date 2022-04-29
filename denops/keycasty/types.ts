export type State = {
  cursor: Position;
  char: string;
  lastCol: number;
  window: WindowState;
  words: PositionArrays;
  chunks: PositionArrays;
  matchPairs: string[];
  savedCol: number;
  lastKeys: string;
};

export type Position = {
  row: number; // zero-based
  col: number; // zero-based
}

export type WindowState = {
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
