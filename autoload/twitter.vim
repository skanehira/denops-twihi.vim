" twitter.vim
" Author: skanehira
" License: MIT

let s:icon = {
      \   "white_heart": "\u2661",
      \   "black_heart": "\u2665",
      \   "comment": "\uf41f",
      \   "retweet": "\u267A",
      \   "retweeted": "\u267B",
      \ }

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

function! twitter#tweet(...) abort
  new twitter://tweet
  if a:0 ==# 1
    if a:1 ==# "--clipboard"
      let b:twitter_media_clipboard = v:true
    else
      let b:twitter_media = a:1
    endif
  endif
endfunction

function! twitter#reply(...) abort
  let tweet = b:twitter_timelines[line(".")-1]
  new twitter://reply
  let b:twitter_reply_tweet = tweet
  call setline(1, ["@" .. tweet.user.screen_name, ""])
  call feedkeys("A ")
  setlocal nomodified
  if a:0 ==# 1
    if a:1 ==# "--clipboard"
      let b:twitter_media_clipboard = v:true
    else
      let b:twitter_media = a:1
    endif
  endif
endfunction

function! twitter#retweet_comment(...) abort
  let tweet = b:twitter_timelines[line(".")-1]
  new twitter://retweet

  " when retweet with comment, tweet body must includes original tweet url.
  let url = printf("https://twitter.com/%s/status/%s", tweet.user.screen_name, tweet.id_str)
  call setline(1, ["", url])
  call feedkeys("A")

  setlocal nomodified
  if a:0 ==# 1
    if a:1 ==# "--clipboard"
      let b:twitter_media_clipboard = v:true
    else
      let b:twitter_media = a:1
    endif
  endif
endfunction

function! twitter#preview(force) abort
  let line = line(".")
  if b:twitter_cursor.line ==# line && !a:force
    return
  endif
  let b:twitter_cursor.line = line
  let tweet = b:twitter_timelines[line-1]
  let bufnr = bufadd(t:twitter_preview_bufname)
  let tweetBody = s:make_tweet_body(tweet)

  call bufload(bufnr)
  silent call deletebufline(bufnr, 1, "$")
  call setbufline(bufnr, 1, tweetBody)

  if bufwinid(bufnr) ==# -1
    let curwin = win_getid()
    keepjumps silent exe "botright vnew" t:twitter_preview_bufname
    setlocal buftype=nofile ft=twitter-preview
    nnoremap <buffer> <silent> q :bw!<CR>
    keepjumps call win_gotoid(curwin)
  endif

  exe "vertical resize" b:twitter_preview_window_width
  redraw!
endfunction

function! s:make_tweet_body(tweet) abort
  let rows = split(a:tweet.text, "\n")
  let barCount = max(map(copy(rows), { _, v -> strdisplaywidth(v) }))
  let border = repeat("─", barCount)

  let icons = [a:tweet.retweeted ? s:icon.retweeted : s:icon.retweet ]
  let icons = add(icons, a:tweet.retweet_count ? a:tweet.retweet_count : " ")
  let icons = add(icons, a:tweet.favorited ? s:icon.black_heart : s:icon.white_heart)
  if a:tweet.favorite_count
    let icons = add(icons, a:tweet.favorite_count)
  endif

  let tweetBody = [
        \ a:tweet.user.name,
        \ "@" .. a:tweet.user.screen_name,
        \ border,
        \ "",
        \ ]
  let tweetBody = tweetBody + rows
  let tweetBody = tweetBody + ["", border, join(icons, " ")]
  return tweetBody
endfunction

" When timeline buffer be closed, close preview buffer
function! twitter#close_preview() abort
  if has_key(t:, "twitter_preview_bufname") && bufexists(t:twitter_preview_bufname)
    exe "bw!" t:twitter_preview_bufname
  endif
endfunction

function! twitter#open() abort
  let tweet = b:twitter_timelines[line(".")-1]
  call denops#notify("twitter", "open", [tweet])
endfunction

function! twitter#retweet() abort
  let tweet = b:twitter_timelines[line(".")-1]
  call denops#notify("twitter", "retweet", [tweet])
endfunction

function! twitter#like() abort
  let tweet = b:twitter_timelines[line(".")-1]
  call denops#notify("twitter", "like", [tweet])
endfunction

let s:action_list = {
      \ "open": function("twitter#open"),
      \ "retweet": function("twitter#retweet"),
      \ "like": function("twitter#like"),
      \ "reply": function("twitter#reply"),
      \ "reply:media": function("twitter#reply"),
      \ "reply:media:clipboard": function("twitter#reply"),
      \ "retweet:comment": function("twitter#retweet_comment"),
      \ "retweet:comment:media": function("twitter#retweet_comment"),
      \ "retweet:comment:clipboard": function("twitter#retweet_comment"),
      \ }

function! twitter#action_list(x, l, p) abort
  if a:l ==# ""
    return keys(s:action_list)
  endif
  let result = filter(keys(s:action_list), { _, v ->  v =~# "^" .. a:l })
  return result
endfunction

function! twitter#choose_action() abort
  let action = input("action: ", "", "customlist,twitter#action_list")
  if action ==# ""
    return
  endif
  call twitter#do_action(action)
endfunction

function! twitter#do_action(action) abort
  if a:action ==# ""
    return
  endif
  let args = []
  if a:action =~# "clipboard$"
    call add(args, "--clipboard")
  elseif a:action =~# "media$"
    let file = input("media: ", "", "file")
    if file ==# ""
      echom "[twitter.vim] cancel"
      return
    endif
    call add(args, file)
  endif
  call call(s:action_list[a:action], args)
endfunction
