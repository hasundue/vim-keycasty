# vim-keycasty
An experimental keycast plugin for Vim/NeoVim.

Still in the alpha stage of development. Use it just for fun. 

## Dependency
- Vim (8.2.3995+) or NeoVim (0.6.1+)
- [Deno](https://deno.land) (1.21.0+)
- [denops.vim](https://github.com/vim-denops/denops.vim) (v3.0.0+)

## Installation
1. Install Deno
2. Install denops.vim and vim-keycasty with your package manager

ex. [vim-plug](https://github.com/junegunn/vim-plug)
```viml
Plug 'vim-denops/denops.vim'
Plug 'hasundue/vim-keycasty'
```

## Commands
- :KeycastyEnable
- :KeycastyDisable

## Supported Vim Commands

### Cursor Movement
- h j k l
- gj gk
- H M L
- w W e E b B ge gE 
- %
- 0 ^ $ g_
- gg G
- f F ; ,
- } {

### Editing
Not supported yet.
