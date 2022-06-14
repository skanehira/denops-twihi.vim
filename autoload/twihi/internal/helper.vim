" helper
" Author: skanehira
" License: MIT

function! twihi#internal#helper#_define_highlight() abort
  hi! TwihiUserName ctermfg=216 guifg=#e2a478 cterm=bold
  hi! TwihiScrennName ctermfg=110 guifg=#84a0c6
  hi! TwihiHashtag ctermfg=110 guifg=#84a0c6
  hi! TwihiHorizontalBorder ctermfg=150 guifg=#b4be82
  hi! TwihiVertcalBorder ctermfg=110 guifg=#84a0c6
  hi! TwihiLike ctermfg=203 ctermbg=234 guifg=#e27878 guibg=#161821
  hi! TwihiRetweeted ctermfg=150 gui=bold guifg=#b4be82
endfunction

" to call function silently
function! twihi#internal#helper#_silent_call(fn, ...) abort
  silent call call(a:fn, a:000)
endfunction

function! twihi#internal#helper#_info(msg) abort
  echom 'twihi: ' .. a:msg
endfunction

function! twihi#internal#helper#_warn(msg) abort
  echohl WarningMsg
  echom 'twihi: ' .. a:msg
  echohl None
endfunction

function! twihi#internal#helper#_error(msg) abort
  echohl ErrorMsg
  echom 'twihi: ' .. a:msg
  echohl None
endfunction

function! twihi#internal#helper#_define_media_commands() abort
  " commands is only available in buffer
  command! -buffer -nargs=+ -complete=file TwihiMediaAdd call twihi#media_add(<f-args>)
  command! -buffer TwihiMediaAddFromClipboard call twihi#media_add_from_clipboard()
  command! -buffer -nargs=+ -complete=customlist,twihi#media_complete TwihiMediaRemove call twihi#media_remove(<f-args>)
  command! -buffer TwihiMediaClear call twihi#media_clear()

  nnoremap <buffer> <silent> <Plug>(twihi:media:add)
        \  <Cmd>call twihi#do_action("media:add")<CR>
  nnoremap <buffer> <silent> <Plug>(twihi:media:add:clipboard)
        \  <Cmd>call twihi#do_action("media:add:clipboard")<CR>
  nnoremap <buffer> <silent> <Plug>(twihi:media:remove)
        \  <Cmd>call twihi#do_action("media:remove")<CR>
  nnoremap <buffer> <silent> <Plug>(twihi:media:clear)
        \  <Cmd>call twihi#do_action("media:clear")<CR>
endfunction
