import type { Denops } from "./deps.ts";
import * as func from "https://deno.land/x/denops_std@v3.3.0/function/nvim/mod.ts"

export function createPopupBuffer(denops: Denops) {
  return func.nvim_create_buf(denops, false, true) as Promise<number>;
}

export function openPopupWindow(denops: Denops, buffer: number, keys?: string) {
  return func.nvim_open_win(denops, buffer, false, {
    focusable: false,
    style: "minimal",
    relative: "cursor",
    row: 1,
    col: 0,
    height: 1,
    width: keys ? keys.length : 1,
  }) as Promise<number>;
}

export function reshapePopupWindow(denops: Denops, width: number) {
  return func.nvim_win_set_config(denops, window, {
    relative: "cursor",
    row: 1,
    col: 0,
    width
  });
}

export function updatePopupBuffer(denops: Denops, buffer: number, keys: string) {
  return func.nvim_buf_set_lines(denops, buffer, 0, -1, false, [keys]);
}

export function closePopupWindow(denops: Denops, window: number) {
  return func.nvim_win_close(denops, window, false);
}

export function clearPopupBuffer(denops: Denops, buffer: number) {
  return denops.cmd(`silent call nvim_buf_set_lines(${buffer}, 0, -1, v:false, [])`);
}
