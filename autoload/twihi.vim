" twihi.vim
" Author: skanehira
" License: MIT

let s:V = vital#twihi#new()
let s:S = s:V.import("Data.String")

" NOTE: When run test in denops, the plugin name will be "@denops-core-test"
" So, when call denops#request(), the plugin name must be "@denops-core-test"
let s:denops_name = has_key(environ(), "TEST_ENDPOINT") ? "@denops-core-test" : "twihi"

let s:icon = {
      \   "white_heart": "\u2661",
      \   "black_heart": "\u2665",
      \   "comment": "\uf41f",
      \   "retweet": "\u267A",
      \   "retweeted": "\u267B",
      \ }

function! twihi#timeline(type, ...) abort
  if a:type ==# "user"
    let bufname = "twihi://timeline/" .. a:1
  elseif a:type ==# "home"
    let bufname = "twihi://home"
  elseif a:type ==# "mentions"
    let bufname = "twihi://mentions"
  elseif a:type ==# "search"
    let bufname = "twihi://search"
  endif
  let winList = win_findbuf(bufnr(bufname))
  if empty(winList)
    exe "tabnew" bufname
  else
    keepjumps call win_gotoid(winList[0])
  endif

  if a:type ==# "search"
    call denops#notify(s:denops_name, "search", a:000)
  endif
endfunction

function! twihi#tweet(...) abort
  new twihi://tweet
  if a:0 ==# 1
    if a:1 ==# "--clipboard"
      let b:twihi_media_clipboard = v:true
    else
      let b:twihi_media = a:1
    endif
  endif
endfunction

function! twihi#reply(...) abort
  let tweet = b:twihi_timelines[line(".")-1]
  new twihi://reply
  let b:twihi_reply_tweet = tweet
  call setline(1, ["@" .. tweet.user.screen_name, ""])
  call feedkeys("A ")
  setlocal nomodified
  if a:0 ==# 1
    if a:1 ==# "--clipboard"
      let b:twihi_media_clipboard = v:true
    else
      let b:twihi_media = a:1
    endif
  endif
endfunction

function! twihi#retweet_comment(...) abort
  let tweet = b:twihi_timelines[line(".")-1]
  new twihi://retweet

  " when retweet with comment, tweet body must includes original tweet url.
  let url = printf("https://twitter.com/%s/status/%s", tweet.user.screen_name, tweet.id_str)
  call setline(1, ["", url])
  call feedkeys("A")

  setlocal nomodified
  if a:0 ==# 1
    if a:1 ==# "--clipboard"
      let b:twihi_media_clipboard = v:true
    else
      let b:twihi_media = a:1
    endif
  endif
endfunction

function! twihi#preview(force) abort
  let line = line(".")
  if b:twihi_cursor.line ==# line && !a:force
    return
  endif
  let b:twihi_cursor.line = line
  let tweet = b:twihi_timelines[line-1]
  let bufnr = bufadd(t:twihi_preview_bufname)
  call bufload(bufnr)
  silent call deletebufline(bufnr, 1, "$")

  if bufwinid(bufnr) ==# -1
    let curwin = win_getid()
    keepjumps silent exe "botright vnew" t:twihi_preview_bufname
    setlocal buftype=nofile ft=twihi-preview nonumber
    nnoremap <buffer> <silent> q :bw!<CR>
    keepjumps call win_gotoid(curwin)
  endif

  let tweet_body = s:make_tweet_body(tweet)
  call setbufline(bufnr, 1, tweet_body)
  if winwidth(0) !=# b:twihi_preview_window_width
    exe "vertical resize" b:twihi_preview_window_width
  endif
endfunction

function! s:make_tweet_body(tweet) abort
  let width = winwidth(bufwinnr(t:twihi_preview_bufname)) - 5
  let rows = s:S.split_by_displaywidth(a:tweet.text, width, -1, 1)
  let rows = map(rows, "trim(v:val)")

  if has_key(a:tweet, "quoted_status")
    let text = s:make_tweet_body(a:tweet.quoted_status)
    let quoted_rows = map(text, { _, v -> " │ " .. v })
    let rows = rows + [""] + quoted_rows
  endif

  let bar_count = max(map(copy(rows), { _, v -> strdisplaywidth(v) }))
  let border = repeat("─", bar_count)

  let tweet = a:tweet
  if has_key(a:tweet, "retweeted_status")
    let tweet = a:tweet.retweeted_status
  endif

  let icons = [tweet.retweeted ? s:icon.retweeted : s:icon.retweet]
  let icons = add(icons, tweet.retweet_count ? tweet.retweet_count : " ")
  let icons = add(icons, tweet.favorited ? s:icon.black_heart : s:icon.white_heart)
  if tweet.favorite_count
    let icons = add(icons, tweet.favorite_count)
  endif

  let source = matchstr(tweet.source, '<a.*>\zs.*\ze<')
  let metadata = tweet.created_at_str .. "・" .. source
  let tweet_body = [
        \ a:tweet.user.name,
        \ "@" .. a:tweet.user.screen_name,
        \ border,
        \ "",
        \ ]
  let tweet_body = tweet_body + rows
  let tweet_body = tweet_body + ["", border,
        \ metadata,
        \ repeat("─", strdisplaywidth(metadata)),
        \ join(icons, " ")]
  return tweet_body
endfunction

" When timeline buffer be closed, close preview buffer
function! twihi#close_preview() abort
  if has_key(t:, "twihi_preview_bufname") && bufexists(t:twihi_preview_bufname)
    exe "bw!" t:twihi_preview_bufname
  endif
endfunction

function! twihi#open() abort
  let tweet = b:twihi_timelines[line(".")-1]
  call denops#request(s:denops_name, "open", [tweet])
endfunction

function! twihi#retweet() abort
  let tweet = b:twihi_timelines[line(".")-1]
  call denops#request(s:denops_name, "retweet", [tweet])
endfunction

function! twihi#like() abort
  let tweet = b:twihi_timelines[line(".")-1]
  call denops#request(s:denops_name, "like", [tweet])
endfunction

function! twihi#yank() abort
  let tweet = b:twihi_timelines[line(".")-1]
  let url = printf("https://twitter.com/%s/status/%s", tweet.user.screen_name, tweet.id_str)
  call setreg(v:register, url)
  echom "yank: " .. url
endfunction

let s:action_list = {
      \ "yank": function("twihi#yank"),
      \ "open": function("twihi#open"),
      \ "retweet": function("twihi#retweet"),
      \ "like": function("twihi#like"),
      \ "reply": function("twihi#reply"),
      \ "reply:media": function("twihi#reply"),
      \ "reply:media:clipboard": function("twihi#reply"),
      \ "retweet:comment": function("twihi#retweet_comment"),
      \ "retweet:comment:media": function("twihi#retweet_comment"),
      \ "retweet:comment:media:clipboard": function("twihi#retweet_comment"),
      \ }

function! twihi#action_complete(x, l, p) abort
  if a:l ==# ""
    return keys(s:action_list)
  endif
  let result = filter(keys(s:action_list), { _, v ->  v =~# "^" .. a:l })
  return result
endfunction

function! twihi#choose_action() abort
  let action = input("action: ", "", "customlist,twihi#action_complete")
  if action ==# ""
    echom "cancel"
    return
  endif
  echom '' | redraw!
  call twihi#do_action(action)
endfunction

function! twihi#do_action(action) abort
  if a:action ==# ""
    return
  endif
  let args = []
  if a:action =~# "clipboard$"
    call add(args, "--clipboard")
  elseif a:action =~# "media$"
    let file = input("media: ", "", "file")
    if file ==# ""
      echom "cancel"
      return
    endif
    call add(args, file)
  endif
  call call(s:action_list[a:action], args)
endfunction
