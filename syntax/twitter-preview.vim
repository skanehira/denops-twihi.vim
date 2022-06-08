hi! link TwitteeUserName Statement
hi! TwitterScreenName ctermfg=216 guifg=#e2a478 cterm=bold

syntax match TwitteeUserName  /\%1l.*/
syntax match TwitterScreenName /\%2l.*/
syntax match Special /[─]\+/
syntax match Statement /│.\+/
syntax match ErrorMsg /♥/
syntax match MoreMsg /♻/
