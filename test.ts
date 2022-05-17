import { test } from "./denocy.vim/mod.ts";

test("test", { target: "all", delay: 50, timeout: 1000 }, (vim) => {
  vim.edit("./README.md");
  vim.cmd("KeycastyEnable");
  vim.moveTo("keycasty");
  vim.popup.should.exist();
  vim.popup.should.not.beEmpty();
  vim.popup.should.include("11w");
  vim.popup.should.onlyInclude("11w");
});
