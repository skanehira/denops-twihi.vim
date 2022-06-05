" twitter_timeline
" Author: skanehira
" License: MIT

let s:previewbuf = "twitter://preview"

" when timeline buffer close, close preview buffer
function! s:close_preview() abort
  if bufexists(s:previewbuf)
    exe "bw!" s:previewbuf
  endif
endfunction

augroup twitter_timeline
  au!
  au BufDelete <buffer> call <SID>close_preview()
augroup END

function! s:open_reply_buffer() abort
  let tweet = b:twitter_timelines[line(".")-1]
  new twitter://reply
  let b:twitter_reply_tweet = tweet
  call setline(1, ["@" .. tweet.user.screen_name, ""])
  call feedkeys("A ")
  setlocal nomodified
endfunction

" when retweet with comment, tweet body must includes original tweet url.
" so when open buffer, we have to set to the buffer
" and get it before posting tweet.
function! s:open_retweet_with_comment_buffer() abort
  let tweet = b:twitter_timelines[line(".")-1]
  new twitter://retweet
  let b:twitter_original_tweet = tweet
  setlocal ft=twitter-retweet
endfunction

nnoremap <buffer> <silent> q :bw!<CR>
nnoremap <buffer> <silent> <Plug>(twitter:tweet:like)
      \ <Cmd>call denops#request("twitter", "like", [b:twitter_timelines[line(".")-1]])<CR>
nnoremap <buffer> <silent> <Plug>(twitter:tweet:open)
      \ <Cmd>call denops#notify("twitter", "open", [b:twitter_timelines[line(".")-1]])<CR>
nnoremap <buffer> <silent> <Plug>(twitter:tweet:new)
      \ <Cmd>new twitter://tweet<CR>
nnoremap <buffer> <silent> <Plug>(twitter:tweet:reply)
      \ <Cmd>call <SID>open_reply_buffer()<CR>
nnoremap <buffer> <silent> <Plug>(twitter:tweet:retweet)
      \ <Cmd>call denops#notify("twitter", "retweet", [b:twitter_timelines[line(".")-1]])<CR>
nnorema <buffer> <silent> <Plug>(twitter:tweet:retweet:comment)
      \ <Cmd>call <SID>open_retweet_with_comment_buffer()<CR>
