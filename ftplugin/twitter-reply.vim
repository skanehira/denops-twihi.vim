" twitter_reply
" Author: skanehira
" License: MIT

augroup twitter_reply
  au!
  au BufWriteCmd <buffer> call denops#notify("twitter", "reply", 
        \ [b:twitter_reply_tweet, join(getline(1, "$"), "\n")])
augroup END

