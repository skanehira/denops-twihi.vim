" twihi_tweet
" Author: skanehira
" License: MIT

augroup twihi_tweet
  au!
  au BufWriteCmd <buffer> call denops#notify("twihi", "tweet", [getline(1, "$")])
augroup END
