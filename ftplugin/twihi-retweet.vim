" twihi_tweet
" Author: skanehira
" License: MIT

augroup twihi_retweet
  au!
  au BufWriteCmd <buffer> call denops#notify("twihi", "retweetWithComment",
        \ [join(getline(1, "$"), "\n")])
augroup END
