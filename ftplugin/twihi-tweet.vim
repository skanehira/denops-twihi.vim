" twihi_tweet
" Author: skanehira
" License: MIT

setlocal nonumber

augroup twihi_tweet
  au!
  au BufWriteCmd <buffer> call denops#notify("twihi", "tweet", [getline(1, "$")])
augroup END

call twihi#internal#helper#_define_media_commands()
