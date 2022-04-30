<!-- panvimdoc-ignore-start -->

# vim-keycasty
![demo](https://user-images.githubusercontent.com/309723/166090921-bbf5794f-4984-42ad-b5ca-dd02d366ed14.gif)

<!-- panvimdoc-ignore-end -->

## Introduction
vim-keycasty is an experimental keycast plugin for Vim/Neovim.

Still work in progress. Use it just for testing or for fun. 

## Design
- vim-keycasty estimates key inputs from each event (cursor movement, text modification, etc.), rather than watching real key inputs, which is not possible on Neovim
- Keycast is shown beside the cursor, so that one can follow both of the cursor movement and the keycast easily

## Limitations
- Keycasts from the plugin are not necessarily identical with true key inputs
- Events other than cursor movement are not supported yet
- Custom key mappings are not supported yet

## Dependency
- Vim (v8.2.3995+) or Neovim (v0.6.1+)
- [Deno](https://deno.land) (v1.21.0+)
- [denops.vim](https://github.com/vim-denops/denops.vim) (v3.0.0+)

## Installation
1. Install Deno
2. Install denops.vim and vim-keycasty with your package manager

Example: [vim-plug](https://github.com/junegunn/vim-plug)

```viml
Plug 'vim-denops/denops.vim'
Plug 'hasundue/vim-keycasty'
```

## Configuration
The plugin refers the updatetime value for the time for which the pop-up automatically disappears if no input is received.

Set it as an appropriate value like 1000 ms, but notice that this may affect behavior of functionalities the editor or other plugins.

Example:

```viml
set updatetime=1000
```

## Commands
#### :KeycastyEnable
Enable keycasty in all buffers.

#### :KeycastyDisable
Disable keycasty in all buffers.

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
