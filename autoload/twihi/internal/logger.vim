" logger
" Author: skanehira
" License: MIT

function! twihi#internal#logger#_info(msg) abort
  redraw!
  echom 'twihi: ' .. a:msg
endfunction

function! twihi#internal#logger#_warn(msg) abort
  redraw!
  echohl WarningMsg
  echom 'twihi: ' .. a:msg
  echohl None
endfunction

function! twihi#internal#logger#_error(msg) abort
  redraw!
  echohl ErrorMsg
  echom 'twihi: ' .. a:msg
  echohl None
endfunction
