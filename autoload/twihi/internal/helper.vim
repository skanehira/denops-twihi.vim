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

