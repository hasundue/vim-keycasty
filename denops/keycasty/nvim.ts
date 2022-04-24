import type { Denops } from "./deps.ts";
import * as func from "https://deno.land/x/denops_std@v3.3.0/function/nvim/mod.ts"

export function createPopupBuffer(denops: Denops) {
  return func.nvim_create_buf(denops, false, true) as Promise<number>;
}

export function openPopupWindow(denops: Denops, bufnr: number) {
  return func.nvim_open_win(denops, bufnr, false, {
    focusable: false,
    style: "minimal",
    relative: "cursor",
    row: 1,
    col: 0,
    height: 1,
    width: 1,
  }) as Promise<number>;
}

export async function updatePopupWindow(denops: Denops, winnr: number) {
  const bufnr = await func.nvim_win_get_buf(denops, winnr) as number;
  const lines = await func.nvim_buf_get_lines(denops, bufnr, 0, -1, false) as string[];
  return func.nvim_win_set_config(denops, winnr, {
    relative: "cursor",
    row: 1,
    col: 0,
    width: lines[0].length,
  });
}

export function updatePopupBuffer(denops: Denops, bufnr: number, text: string) {
  return func.nvim_buf_set_lines(denops, bufnr, 0, -1, false, [text]);
}

export function closePopupWindow(denops: Denops, winnr: number) {
  return func.nvim_win_close(denops, winnr, false);
}

export function clearPopupBuffer(denops: Denops, bufnr: number) {
  return denops.cmd(`silent call nvim_buf_set_lines(${bufnr}, 0, -1, v:false, [])`);
}
