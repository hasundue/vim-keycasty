import { Denops, autocmd } from "./deps.ts";
import { getState, getKeysCursorMoved } from "./funcs.ts";

export async function main(denops: Denops) {
  let bufnr = 0;
  let winnr = 0;
  let state = await getState(denops);
  let keys: string[] = [];

  const keycasty = denops.meta.host === "nvim"
    ? await import("./nvim.ts")
    : await import("./vim.ts");

  denops.dispatcher = {
    async enable() {
      if (!bufnr) {
        bufnr = await keycasty.createPopupBuffer(denops);
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
      await autocmd.group(denops, "keycasty", (helper) => {
        helper.remove();
      });
    },

    async handleCursorMoved() {
      const newState = await getState(denops, state);
      const newKeys = await getKeysCursorMoved(denops, newState, state);
      keys = keys.concat(newKeys);

      const text = keys.join("");
      keycasty.updatePopupBuffer(denops, bufnr, text);

      if (!winnr) {
        winnr = await keycasty.openPopupWindow(denops, bufnr);
      }

      keycasty.updatePopupWindow(denops, winnr, text.length);

      state = newState;
    },

    async clear() {
      if (winnr) {
        keycasty.closePopupWindow(denops, winnr);
        winnr = 0;

        keys = [];

        await keycasty.clearPopupBuffer(denops, bufnr);
      }
    },
  };

  await denops.cmd(`command! KeycastyEnable call denops#notify("${denops.name}", "enable", [])`);
  await denops.cmd(`command! KeycastyDisable call denops#notify("${denops.name}", "disable", [])`);
}
