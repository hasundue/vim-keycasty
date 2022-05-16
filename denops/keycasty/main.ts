import type { Denops } from "./deps.ts";
import type { State } from "./types.ts";
import { autocmd, popup, vim, buffer } from "./deps.ts";
import { getState, getKeysCursorMoved } from "./funcs.ts";

export async function main(denops: Denops) {
  let bufnr = 0;
  let winid = 0;
  let state: State | undefined;
  let keys: string[] = [];

  denops.dispatcher = {
    async enable() {
      if (!bufnr) {
        bufnr = await vim.bufadd(denops, "");
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
        await denops.cmd(`bd ${bufnr}`);
        bufnr = 0;
      }
      if (winid) {
        await popup.close(denops, winid);
        winid = 0;
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
      await buffer.replace(denops, bufnr, [text]);

      const style = {
        row: newState.cursor.row + 2,
        col: newState.window.textoff + newState.cursor.col + 1,
        width: text.length,
        height: 1,
      };

      if (!winid) {
        winid = await popup.open(denops, bufnr, style);
      }
      else {
        await popup.move(denops, winid, style);
      }

      state = newState;
    },

    async clear() {
      if (winid) {
        await popup.close(denops, winid);
        await buffer.replace(denops, bufnr, []);
        winid = 0;
        keys = [];
      }
    },
  };

  await denops.cmd(`command! KeycastyEnable call denops#notify("${denops.name}", "enable", [])`);
  await denops.cmd(`command! KeycastyDisable call denops#notify("${denops.name}", "disable", [])`);
}
