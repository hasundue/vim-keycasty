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
      bufnr = await keycasty.createPopupBuffer(denops);

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

    async handleCursorMoved() {
      const newState = await getState(denops);
      const newKeys = getKeysCursorMoved(newState, state);
      keys = keys.concat(newKeys);

      const text = keys.join("");
      keycasty.updatePopupBuffer(denops, bufnr, text);

      if (!winnr) {
        winnr = await keycasty.openPopupWindow(denops, bufnr);
      }

      keycasty.updatePopupWindow(denops, winnr);

      state = newState;
    },

    async clear() {
      if (winnr) {
        keycasty.closePopupWindow(denops, winnr);
        await keycasty.clearPopupBuffer(denops, bufnr);
        winnr = 0;
        keys = [];
      }
    },
  };

  await denops.cmd(`command! KeycastyEnable call denops#notify("${denops.name}", "enable", [])`);
}
