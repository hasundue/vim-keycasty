import type { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import * as vim from "https://deno.land/x/denops_std@v3.3.0/function/mod.ts";
import * as nvim from "https://deno.land/x/denops_std@v3.3.0/function/nvim/mod.ts"
import * as autocmd from "https://deno.land/x/denops_std@v3.3.0/autocmd/mod.ts";

type State = {
  row: number;
  col: number;
  char: string;
}

async function getState(denops: Denops): Promise<State> {
  const position: vim.Position = await vim.getcurpos(denops);
  const line = await vim.getline(denops, ".");
  const col = await vim.col(denops, ".");

  return {
    row: position[1],
    col: position[2],
    char: line[col-1],
  };
}

function getKeys(current: State, previous: State): string {
  let keys = "";

  if (current.row === previous.row) {
    const diff = current.col - previous.col;
    const diffAbs = Math.abs(diff);

    if (diffAbs > 1) {
      keys += diffAbs.toString();
    }

    keys += diff > 0 ? "l" : "h";
  }
  else {
    const diff = current.row - previous.row;
    const diffAbs = Math.abs(diff);

    if (diffAbs > 1) {
      keys += diffAbs.toString();
    }

    keys += diff > 0 ? "j" : "k";
  }

  return keys;
}

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
