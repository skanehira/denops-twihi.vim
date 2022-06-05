" twitter_timeline
" Author: skanehira
" License: MIT

let s:icon = {
      \   "white_heart": "\u2661",
      \   "black_heart": "\u2665",
      \   "comment": "\uf41f",
      \   "retweet": "\u267A",
      \   "retweeted": "\u267B",
      \ }

let t:twitter_preview_bufname = printf("twitter://%s/preview", b:twitter_timeline_type)
let b:twitter_cursor = {"line": -1}

exe "augroup twitter_timeline_" .. b:twitter_timeline_type
  au!
  au CursorMoved <buffer> call <SID>preview(v:false)
  au BufDelete <buffer> call <SID>close_preview()
  au User twitter_preview call <SID>preview(v:false)
  au User twitter_force_preview call <SID>preview(v:true)
augroup END

function! s:make_tweet_body(tweet) abort
  let rows = split(a:tweet.text, "\n")
  let count = max(map(copy(rows), { _, v -> strdisplaywidth(v) }))
  let border = repeat("─", count)

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

function! s:preview(force) abort
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
    keepjumps exe "botright vnew" t:twitter_preview_bufname
    setlocal buftype=nofile ft=twitter-preview
    nnoremap <buffer> <silent> q :bw!<CR>
    keepjumps call win_gotoid(curwin)
  endif

  exe "vertical resize" b:twitter_preview_window_width
  redraw!
endfunction

" when timeline buffer close, close preview buffer
function! s:close_preview() abort
  if bufexists(t:twitter_preview_bufname)
    exe "bw!" t:twitter_preview_bufname
  endif
endfunction

function! s:open_reply_buffer() abort
  let tweet = b:twitter_timelines[line(".")-1]
  new twitter://reply
  let b:twitter_reply_tweet = tweet
  call setline(1, ["@" .. tweet.user.screen_name, ""])
  call feedkeys("A ")
  setlocal nomodified
endfunction

" when retweet with comment, tweet body must includes original tweet url.
" so when open buffer, we have to set to the buffer
" and get it before posting tweet.
function! s:open_retweet_with_comment_buffer() abort
  let tweet = b:twitter_timelines[line(".")-1]
  new twitter://retweet
  let b:twitter_original_tweet = tweet
  setlocal ft=twitter-retweet
endfunction

nnoremap <buffer> <silent> q :bw!<CR>
nnoremap <buffer> <silent> <Plug>(twitter:tweet:like)
      \ <Cmd>call denops#request("twitter", "like", [b:twitter_timelines[line(".")-1]])<CR>
nnoremap <buffer> <silent> <Plug>(twitter:tweet:open)
      \ <Cmd>call denops#notify("twitter", "open", [b:twitter_timelines[line(".")-1]])<CR>
nnoremap <buffer> <silent> <Plug>(twitter:tweet:new)
      \ <Cmd>new twitter://tweet<CR>
nnoremap <buffer> <silent> <Plug>(twitter:tweet:reply)
      \ <Cmd>call <SID>open_reply_buffer()<CR>
nnoremap <buffer> <silent> <Plug>(twitter:tweet:retweet)
      \ <Cmd>call denops#notify("twitter", "retweet", [b:twitter_timelines[line(".")-1]])<CR>
nnorema <buffer> <silent> <Plug>(twitter:tweet:retweet:comment)
      \ <Cmd>call <SID>open_retweet_with_comment_buffer()<CR>
