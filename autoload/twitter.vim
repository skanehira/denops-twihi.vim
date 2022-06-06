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

function! twitter#tweet_with_media(...) abort
  new twitter://tweet
  if a:0 ==# 0
    let b:twitter_media_clipboard = v:true
  else
    let b:twitter_media = a:1
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
