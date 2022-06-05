" twitter.vim
" Author: skanehira
" License: MIT

function twitter#deletebufline(bufnr, start, end) abort
  silent call deletebufline(a:bufnr, a:start, a:end)
endfunction

function! twitter#timeline(type, ...) abort
  if a:type ==# "user"
    let bufname = "twitter://timeline/" .. a:1
  elseif a:type ==# "home"
    let bufname = "twitter://home"
  elseif a:type ==# "mentions"
    let bufname = "twitter://mentions"
  endif
  let winList = win_findbuf(bufnr(bufname))
  if empty(winList)
    exe "tabnew" bufname
  else
    keepjumps call win_gotoid(winList[0])
  endif
endfunction
