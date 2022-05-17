import { test } from "https://pax.deno.dev/hasundue/denocy.vim/mod.ts";

test("test", { target: "all", delay: 20 }, (vim) => {
  vim.edit("./README.md");
  vim.cmd("normal gg");
  vim.cmd("KeycastyEnable");
  vim.moveTo("keycasty");
  vim.popup.should.exist();
  vim.popup.should.onlyInclude("11w");
});
