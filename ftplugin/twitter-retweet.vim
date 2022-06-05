" twitter_tweet
" Author: skanehira
" License: MIT

augroup twitter_retweet
  au!
  au BufWriteCmd <buffer> call denops#notify("twitter", "retweetWithComment", 
        \ [join(getline(1, "$"), "\n")])
augroup END
