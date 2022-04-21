import type { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import * as vim from "https://deno.land/x/denops_std@v3.3.0/function/mod.ts";
import * as nvim from "https://deno.land/x/denops_std@v3.3.0/function/nvim/mod.ts"
import * as autocmd from "https://deno.land/x/denops_std@v3.3.0/autocmd/mod.ts";

export async function main(denops: Denops) {
  const namespace = await nvim.nvim_create_namespace(denops, denops.name) as number;
  let extmark = 0;

  denops.dispatcher = {
    async show() {
      const curpos: vim.Position = await vim.getcurpos(denops);

      extmark = await nvim.nvim_buf_set_extmark(denops, 0, namespace, curpos[1]+1, curpos[2], {
        id: extmark,
        virt_text: "test",
        virt_text_post: "overlay",
      }) as number;
    },
  };

  await autocmd.group(denops, "keycasty", (helper) => {
    helper.remove();
    helper.define(
      "CursorMoved",
      "",
      `call denops#notify("${denops.name}", "show", [])`
    );
  });
}
