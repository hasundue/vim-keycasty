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

export async function openPopupWindow(denops: Denops, bufnr: number) {
  const window = await vim.bufwinnr(denops, bufnr);

  if (window < 0) {
    return denops.call("popup_create", bufnr, {
      "line": "cursor+1",
      "col": "cursor" 
    }) as Promise<number>;
  }
  else {
    denops.call("popup_show", window);
    updatePopupWindow(denops, window);
    return window;
  }
}

export function updatePopupWindow(denops: Denops, window: number) {
  denops.call("popup_move", window, { "line": "cursor+1", "col": "cursor" });
  return denops.cmd("redraw");
}

export function updatePopupBuffer(denops: Denops, bufnr: number, keys: string) {
  return vim.setbufline(denops, bufnr, 1, keys);
}

export function closePopupWindow(denops: Denops, window: number) {
  denops.call("popup_hide", window);
  return denops.cmd("redraw");
}

export function clearPopupBuffer(denops: Denops, bufnr: number) {
  return denops.cmd(`silent call setbufline(${bufnr}, 1, "")`);
}
