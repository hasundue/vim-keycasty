import { test } from "./denocy.vim/mod.ts";

test("test", { target: "all" }, (vim) => {
  vim.edit("./README.md");
  vim.cmd("KeycastyEnable");
  vim.moveTo("keycasty");
  vim.moveTo("vim");
  vim.popup.should.exist();
  // vim.popup.should.onlyInclude("11w");
});
