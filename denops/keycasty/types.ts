export type State = {
  row: number;
  col: number;
  char: string;
  width: number;
  height: number;
  topline: number;
  botline: number;
  wordStart: number[];
  wordEnd: number[];
  chunkStart: number[];
  chunkEnd: number[];
  matchPairs: string[];
};

