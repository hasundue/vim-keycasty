import { Denops, autocmd } from "./deps.ts";
import { getState, getKeys } from "./funcs.ts";

export async function main(denops: Denops) {
  let buffer = 0;
  let window = 0;
  let state = await getState(denops);
  let keys = "";

  // const keycasty = denops.meta.host === "nvim"
  //   ? await import("./nvim.ts")
  //   : await import("./vim.ts");
  const keycasty = await import("./nvim.ts");

  denops.dispatcher = {
    async enable() {
      buffer = await keycasty.createPopupBuffer(denops);

      await autocmd.group(denops, "keycasty", (helper) => {
        helper.remove();
        helper.define(
          "CursorMoved",
          "*",
          `call denops#notify("${denops.name}", "show", [])`
        );
        helper.define(
          [ "CursorHold", "InsertEnter" ],
          "*",
          `call denops#notify("${denops.name}", "clear", [])`
        );
      });
    },

    async show() {
      const newState = await getState(denops);
      keys += getKeys(newState, state);

      keycasty.updatePopupBuffer(denops, buffer, keys);

      if (!window) {
        window = await keycasty.openPopupWindow(denops, buffer, keys);
      }
      else {
        keycasty.reshapePopupWindow(denops, keys.length);
      }

      state = newState;
    },

    async clear() {
      if (window) {
        keycasty.closePopupWindow(denops, window);
        await keycasty.clearPopupBuffer(denops, buffer);
        window = 0;
        keys = "";
      }
    },
  };

  await denops.cmd(`command! KeycastyEnable call denops#notify("${denops.name}", "enable", [])`);
}
