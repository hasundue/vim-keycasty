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
  const winnr = await vim.bufwinnr(denops, bufnr);

  if (winnr < 0) {
    return denops.call("popup_create", bufnr, {
      "line": "cursor+1",
      "col": "cursor" 
    }) as Promise<number>;
  }
  else {
    denops.call("popup_show", winnr);
    updatePopupWindow(denops, winnr);
    return winnr;
  }
}

export function updatePopupWindow(denops: Denops, winnr: number) {
  denops.call("popup_move", winnr, { "line": "cursor+1", "col": "cursor" });
  return denops.cmd("redraw");
}

export function updatePopupBuffer(denops: Denops, bufnr: number, keys: string[]) {
  const text = keys.join(" ");
  return vim.setbufline(denops, bufnr, 1, text);
}

export function closePopupWindow(denops: Denops, winnr: number) {
  denops.call("popup_hide", winnr);
  return denops.cmd("redraw");
}

export function clearPopupBuffer(denops: Denops, bufnr: number) {
  return denops.cmd(`silent call setbufline(${bufnr}, 1, "")`);
}
