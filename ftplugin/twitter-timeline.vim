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
