" twitter_tweet
" Author: skanehira
" License: MIT

augroup twitter_tweet
  au!
  au BufWriteCmd <buffer> call denops#notify("twitter", "tweet", [getline(1, "$")])
augroup END
