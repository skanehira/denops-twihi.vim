hi! link UserName Statement
hi! ScreenName ctermfg=216 guifg=#e2a478 cterm=bold

syntax match UserName /\s#.\+\s/
syntax match UserName  /\%1l.*/
syntax match ScreenName /\%2l.*/
syntax match Special /[─]\+/
syntax match Statement /│.\+/
syntax match ErrorMsg /♥/
syntax match MoreMsg /♻/
