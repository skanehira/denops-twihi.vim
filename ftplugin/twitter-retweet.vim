" twitter_tweet
" Author: skanehira
" License: MIT

augroup twitter_retweet
  au!
  au BufWriteCmd <buffer> call denops#notify("twitter", "retweetWithComment", 
        \ [b:twitter_original_tweet, join(getline(1, "$"), "\n")])
augroup END
