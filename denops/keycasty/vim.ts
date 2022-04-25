import type { Denops } from "./deps.ts";
import { vim, buffer, option } from "./deps.ts";

export async function createPopupBuffer(denops: Denops) {
  const bufnr = await vim.bufadd(denops, "keycasty");

  buffer.ensure(denops, bufnr, async () => {
    await option.buftype.setLocal(denops, "nofile");
    await option.swapfile.setLocal(denops, false);
    await option.buflisted.setLocal(denops, false);
  });

  return bufnr;
}

export function updatePopupBuffer(denops: Denops, bufnr: number, text: string) {
  return vim.setbufline(denops, bufnr, 1, text);
}

export function clearPopupBuffer(denops: Denops, bufnr: number) {
  return denops.cmd(`silent call setbufline(${bufnr}, 1, "")`);
}

export function openPopupWindow(denops: Denops, bufnr: number) {
  return denops.call("popup_create", bufnr, {
    "line": "cursor+1",
    "col": "cursor" 
  }) as Promise<number>;
}

export function updatePopupWindow(denops: Denops, winnr: number, _width: number) {
  denops.call("popup_move", winnr, { "line": "cursor+1", "col": "cursor" });
  return denops.cmd("redraw");
}

export function closePopupWindow(denops: Denops, winnr: number) {
  denops.call("popup_close", winnr);
  return denops.cmd("redraw");
}
