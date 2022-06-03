" twitter.vim
" Author: skanehira
" License: MIT

function twitter#deletebufline(bufnr, start, end) abort
  silent call deletebufline(a:bufnr, a:start, a:end)
endfunction

function! twitter#timeline(...) abort
  if empty(a:000)
    let bufname = "twitter://home"
  else
    let bufname = "twitter://timeline/" .. a:1
  endif
  let winList = win_findbuf(bufnr(bufname))
  if empty(winList)
    exe "tabnew" bufname
  else
    keepjumps call win_gotoid(winList[0])
  endif
endfunction
