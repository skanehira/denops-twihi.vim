" twihi.vim
" Author: skanehira
" License: MIT

" NOTE: When run test in denops, the plugin name will be "@denops-core-test"
" So, when call denops#request(), the plugin name must be "@denops-core-test"
let s:denops_name = get(environ(), "DENOPS_NAME", "twihi")

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
endfunction

function! twihi#get_tweet() abort
  let curline = line(".")
  let tweet = filter(copy(b:twihi_timelines),  { _, tweet -> tweet.position.start <= curline && curline <= tweet.position.end })
  if len(tweet) == 0
    return {}
  endif
  return tweet[0]
endfunction

function! twihi#reply() abort
  let tweet = twihi#get_tweet()
  if empty(tweet)
    return
  endif
  new twihi://reply
  let b:twihi_reply_tweet = tweet
  call setline(1, ["@" .. tweet.user.screen_name, ""])
  call feedkeys("A ")
  setlocal nomodified
endfunction

function! twihi#retweet_comment() abort
  let tweet = twihi#get_tweet()
  if empty(tweet)
    return
  endif
  new twihi://retweet

  " when retweet with comment, tweet body must includes original tweet url.
  let url = printf("https://twitter.com/%s/status/%s", tweet.user.screen_name, tweet.id_str)
  call setline(1, ["", url])
  call feedkeys("A")
  setlocal nomodified
endfunction

function! twihi#draw_timeline() abort
  setlocal modifiable
  let start = 1
  let idx = 0
  for tweet in b:twihi_timelines
    let body = s:make_tweet_body(tweet)
    let end = start + len(body)
    let tweet.position = {
          \ 'idx': idx,
          \ 'start': start,
          \ 'end': end-1,
          \ }
    call setline(start, body)
    let start = end
    let idx += 1
  endfor
  setlocal nomodifiable
endfunction

function! s:redraw_tweet(tweet) abort
  setlocal modifiable
  call setline(a:tweet.position.start, s:make_tweet_body(a:tweet))
  setlocal nomodifiable
endfunction

function! s:make_tweet_body(tweet) abort
  let width = winwidth(0) + getwininfo(win_getid())[0].textoff
  let rows = split(a:tweet.text, "\n")

  if has_key(a:tweet, "quoted_status")
    let text = s:make_tweet_body(a:tweet.quoted_status)
    " remove bottom border
    call remove(text, -1)
    " make border for original tweet
    let border = '  ' .. repeat("─", width-2)
    let quoted_rows = map(text, { _, v -> "  " .. v }) + [""]
    let rows = rows + ["", border] + quoted_rows + [border]
  endif

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
        \ a:tweet.user.name .. " | @" .. a:tweet.user.screen_name .. " " .. metadata,
        \ "",
        \ ]
  let tweet_body = tweet_body + rows
  let tweet_body = tweet_body + [
        \ "",
        \ join(icons, " "),
        \ repeat("─", width),
        \ ]
  return tweet_body
endfunction

function! twihi#open() abort
  let tweet = twihi#get_tweet()
  if empty(tweet)
    return
  endif
  call denops#request(s:denops_name, "open", [tweet])
endfunction

function! twihi#retweet() abort
  let tweet = twihi#get_tweet()
  if empty(tweet)
    return
  endif
  call denops#request(s:denops_name, "retweet", [tweet])
  if has_key(tweet, 'retweeted_status')
    let tweet.retweeted_status.retweeted = v:true
  else
    let tweet.retweeted = v:true
  endif
  let tweet.retweet_count += 1
  call s:redraw_tweet(tweet)
endfunction

function! twihi#like() abort
  let tweet = twihi#get_tweet()
  if empty(tweet)
    return
  endif
  call denops#request(s:denops_name, "like", [tweet])

  if has_key(tweet, 'retweeted_status')
    let tweet.retweeted_status.favorited = v:true
  else
    let tweet.favorited = v:true
  endif
  let tweet.favorite_count += 1
  call s:redraw_tweet(tweet)
endfunction

function! twihi#yank() abort
  let tweet = twihi#get_tweet()
  if empty(tweet)
    return
  endif
  let url = printf("https://twitter.com/%s/status/%s", tweet.user.screen_name, tweet.id_str)
  call setreg(v:register, url)
  call twihi#internal#logger#_info("yank: " .. url)
endfunction

function! twihi#media_add(...) abort
  let medias = get(b:, "twihi_medias", [])
  let c = len(medias)
  if a:0 + c ># 4
    call twihi#internal#logger#_error("can't upload media more than 4")
    return
  endif
  let medias += a:000
  let b:twihi_medias = medias
endfunction

function! twihi#media_add_from_clipboard() abort
  let medias = get(b:, "twihi_medias", [])
  if 1 + len(medias) ># 4
    call twihi#internal#logger#_error("can't upload media more than 4")
    return
  endif
  call twihi#internal#logger#_info("adding...")
  let fname = denops#request(s:denops_name, "mediaAddFromClipboard", [])
  redraw | echom ''
  call add(medias, fname)
  let b:twihi_medias = medias
endfunction

function! twihi#media_clear() abort
  if has_key(b:, "twihi_medias")
    let b:twihi_medias = []
  endif
endfunction

function! twihi#media_remove(...) abort
  if has_key(b:, "twihi_medias")
    for v in a:000
      let idx = matchstrpos(b:twihi_medias, "^" .. v .. "$")[1]
      if idx ==# -1
        continue
      endif
      call remove(b:twihi_medias, idx)
    endfor
  endif
  redraw | echo ''
endfunction

function! twihi#media_open(file) abort
 call denops#request(s:denops_name, "openMedia", [a:file]) 
endfunction

function! twihi#media_complete(x, l, p) abort
  let medias = get(b:, "twihi_medias", [])
  if a:x ==# ""
    return medias
  endif
  let result = filter(copy(medias), { _, v -> v =~# a:x })
  return result
endfunction

let s:action_list = {
      \ "yank": function("twihi#yank"),
      \ "open": function("twihi#open"),
      \ "retweet": function("twihi#retweet"),
      \ "like": function("twihi#like"),
      \ "reply": function("twihi#reply"),
      \ "retweet:comment": function("twihi#retweet_comment"),
      \ "media:add": function("twihi#media_add"),
      \ "media:add:clipboard": function("twihi#media_add_from_clipboard"),
      \ "media:remove": function("twihi#media_remove"),
      \ "media:clear": function("twihi#media_clear"),
      \ "media:open": function("twihi#media_open"),
      \ }

function! twihi#action_complete(x, l, p) abort
  if a:x ==# ""
    return keys(s:action_list)
  endif
  let result = filter(keys(s:action_list), { _, v ->  v =~# "^" .. a:x })
  return result
endfunction

function! twihi#choose_action() abort
  let action = input("action: ", "", "customlist,twihi#action_complete")
  if action ==# ""
    call twihi#internal#logger#_warn("cancel")
    return
  endif
  call twihi#do_action(action)
endfunction

function! twihi#do_action(action) abort
  if a:action ==# ""
    return
  endif

  let args = []

  if a:action ==# "media:add" || a:action ==# "media:remove" || a:action ==# "media:open"
    let file = input("file: ", "", "customlist,twihi#media_complete")
    if file ==# ""
      return
    endif
    call add(args, file)
  endif
  call call(s:action_list[a:action], args)
endfunction

function! twihi#tweet_prev() abort
  let cur = twihi#get_tweet()
  if empty(cur)
    return
  endif
  let idx = cur.position.idx-1
  if 0 > idx
    return
  endif

  let prev = b:twihi_timelines[idx]
  call cursor([prev.position.start, 0])
endfunction

function! twihi#tweet_next() abort
  let cur = twihi#get_tweet()
  if empty(cur)
    return
  endif
  let idx = cur.position.idx+1
  if len(b:twihi_timelines) <= idx
    return
  endif

  let next = b:twihi_timelines[idx]
  call cursor([next.position.start, 0])
endfunction
