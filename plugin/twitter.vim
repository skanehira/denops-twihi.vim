" twitter
" Author: skanehira
" License: MIT

if exists('loaded_twitter')
  finish
endif
let g:loaded_twitter = 1

command! -nargs=? TwitterHome call twitter#timeline("home")
command! -nargs=1 TwitterTimeline call twitter#timeline("user", <f-args>)
command! TwitterMentions call twitter#timeline("mentions")
command! TwitterTweet :new twitter://tweet
command! TwitterEditConfig call denops#notify("${denops.name}", "editConfig", [])
