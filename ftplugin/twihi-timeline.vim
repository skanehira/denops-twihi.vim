" twihi_timeline
" Author: skanehira
" License: MIT

nnoremap <buffer> <silent> q :bw<CR>

nnoremap <buffer> <silent> <Plug>(twihi:action)
      \ <Cmd>call twihi#choose_action()<CR>

nmap <buffer> <silent> a <Plug>(twihi:action)

nnoremap <buffer> <silent> <Plug>(twihi:tweet:like)
      \ <Cmd>call twihi#do_action("like")<CR>

nnoremap <buffer> <silent> <Plug>(twihi:tweet:open)
      \ <Cmd>call twihi#do_action("open")<CR>

nnoremap <buffer> <silent> <Plug>(twihi:tweet:yank)
      \ <Cmd>call twihi#yank()<CR>

nnoremap <buffer> <silent> <Plug>(twihi:reply)
      \ <Cmd>call twihi#do_action("reply")<CR>

nnoremap <buffer> <silent> <Plug>(twihi:retweet)
      \ <Cmd>call twihi#do_action("retweet")<CR>

nnoremap <buffer> <silent> <Plug>(twihi:retweet:comment)
      \  <Cmd>call twihi#do_action("retweet:comment")<CR>
