# denops-twihi.vim
Unofficial Twitter Vim/Neovim plugin.

![](https://i.gyazo.com/64dfeaae07b0d3193fc6798fa6af5f70.png)

## Requirements
- [denops.vim](https://github.com/vim-denops/denops.vim)
- xclip(Linux only)

## Usage
After edit configuration (`:h twihi-usage`), you can run some commands.  
Please refer help to see more details.

```vim
" open the user's timeline
:TwihiTimeline {userid}

" open the home timeline
:TwihiHome

" open the mentions timeline
:TwihiMentions

" open tweet buffer
:TwihiTweet

" edit config
:TwihiEditConfig
```

## Options
Please refer help(`:h twihi-variables`) to see details.

```vim
" Sets the value of the interval to check for mentions.
g:twihi_mention_check_interval

" Set the UI to notify mentions.
g:twihi_notify_ui
```

## Author
skanehira
