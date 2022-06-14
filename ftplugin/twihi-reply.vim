" twihi_reply
" Author: skanehira
" License: MIT

augroup twihi_reply
  au!
  au BufWriteCmd <buffer> call denops#notify("twihi", "reply",
        \ [b:twihi_reply_tweet, join(getline(1, "$"), "\n")])
augroup END

call twihi#internal#helper#_define_media_commands()
