import type { Denops } from "./deps.ts";
import type { State } from "./types.ts";
import { autocmd } from "./deps.ts";
import { getState, getKeysCursorMoved } from "./funcs.ts";

export async function main(denops: Denops) {
  let bufnr = 0;
  let winnr = 0;
  let state: State | undefined;
  let keys: string[] = [];

  const keycasty = denops.meta.host === "nvim"
    ? await import("./nvim.ts")
    : await import("./vim.ts");

  denops.dispatcher = {
    async enable() {
      if (!bufnr) {
        bufnr = await keycasty.createPopupBuffer(denops);
      }
      if (!state) {
        state = await getState(denops);
      }
      await autocmd.group(denops, "keycasty", (helper) => {
        helper.remove();
        helper.define(
          "CursorMoved",
          "*",
          `call denops#notify("${denops.name}", "handleCursorMoved", [])`
        );
        helper.define(
          [ "CursorHold", "InsertEnter" ],
          "*",
          `call denops#notify("${denops.name}", "clear", [])`
        );
      });
    },

    async disable() {
      if (bufnr) {
        await denops.cmd(`bw ${bufnr}`);
        bufnr = 0;
      }
      if (winnr) {
        await keycasty.closePopupWindow(denops, winnr);
        winnr = 0;
      }
      if (state) {
        state = undefined;
      }
      await autocmd.group(denops, "keycasty", (helper) => {
        helper.remove();
      });
    },

    async handleCursorMoved() {
      const newState = await getState(denops, state);
      const newKeys = await getKeysCursorMoved(denops, newState, state!);

      if (!newKeys) return;

      keys = keys.concat(newKeys);
      const text = keys.join("");
      await keycasty.updatePopupBuffer(denops, bufnr, text);

      if (!winnr) {
        winnr = await keycasty.openPopupWindow(denops, bufnr);
      }

      await keycasty.updatePopupWindow(denops, winnr, text.length);
      state = newState;
    },

    async clear() {
      if (winnr) {
        await keycasty.closePopupWindow(denops, winnr);
        await keycasty.clearPopupBuffer(denops, bufnr);
        winnr = 0;
        keys = [];
      }
    },
  };

  await denops.cmd(`command! KeycastyEnable call denops#notify("${denops.name}", "enable", [])`);
  await denops.cmd(`command! KeycastyDisable call denops#notify("${denops.name}", "disable", [])`);
}
