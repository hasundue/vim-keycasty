import { Denops, nvim, autocmd } from "./deps.ts";
import { getState, getKeys } from "./funcs.ts";

export async function main(denops: Denops) {
  let buffer = 0;
  let window = 0;
  let state = await getState(denops);
  let keys = "";

  denops.dispatcher = {
    async enable() {
      buffer = await nvim.nvim_create_buf(denops, false, true) as number;

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

      if (!window) {
        window = await nvim.nvim_open_win(denops, buffer, false, {
          focusable: false,
          style: "minimal",
          relative: "cursor",
          row: 1,
          col: 0,
          height: 1,
          width: keys.length,
        }) as number;
      }
      else {
        nvim.nvim_win_set_config(denops, window, {
          relative: "cursor",
          row: 1,
          col: 0,
          width: keys.length,
        });
      }

      nvim.nvim_buf_set_lines(denops, buffer, 0, -1, false, [keys]);

      state = newState;
    },

    async clear() {
      if (window) {
        await nvim.nvim_win_close(denops, window, false);
        await denops.cmd(`silent call nvim_buf_set_lines(${buffer}, 0, -1, v:false, [])`);
        window = 0;
        keys = "";
      }
    },
  };

  await denops.cmd(`command! KeycastyEnable call denops#notify("${denops.name}", "enable", [])`);
}
