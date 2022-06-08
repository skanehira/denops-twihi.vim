" twitter_timeline
" Author: skanehira
" License: MIT

nnoremap <buffer> <silent> q :bw<CR>

nnoremap <buffer> <silent> <Plug>(twitter:action)
      \ <Cmd>call twitter#choose_action()<CR>

nmap <buffer> <silent> a <Plug>(twitter:action)

nnoremap <buffer> <silent> <Plug>(twitter:tweet:like)
      \ <Cmd>call twitter#do_action("like")<CR>

nnoremap <buffer> <silent> <Plug>(twitter:tweet:open)
      \ <Cmd>call twitter#do_action("open")<CR>

nnoremap <buffer> <silent> <Plug>(twitter:tweet:yank)
      \ <Cmd>call twitter#yank()<CR>

nnoremap <buffer> <silent> <Plug>(twitter:retweet)
      \ <Cmd>call twitter#do_action("retweet")<CR>

nnoremap <buffer> <silent> <Plug>(twitter:reply)
      \ <Cmd>call twitter#do_action("reply")<CR>
nnoremap <buffer> <silent> <Plug>(twitter:reply:media)
      \ <Cmd>call twitter#do_action("reply:media")<CR>
nnoremap <buffer> <silent> <Plug>(twitter:reply:media:clipboard)
      \ <Cmd>call twitter#do_action("reply:media:clipboard")<CR>

nnoremap <buffer> <silent> <Plug>(twitter:retweet:comment)
      \  <Cmd>call twitter#do_action("retweet:comment")<CR>
nnoremap <buffer> <silent> <Plug>(twitter:retweet:comment:media)
      \  <Cmd>call twitter#do_action("retweet:comment:media")<CR>
nnoremap <buffer> <silent> <Plug>(twitter:retweet:comment:media:clipboard)
      \ <Cmd>call twitter#do_action("retweet:comment:media:clipboard")<CR>
