" notify
" Author: skanehira
" License: MIT

" show notification using popup/float window
" @param {string[]} message - notification message
" @param {object} opt - option for create notification
" @param {string} opt.time - until close window time(msec)
" @param {string} opt.ft - buffer's file type
if has('nvim')
  func s:close_floatwin(winid, timer) abort
    call nvim_win_close(a:winid, v:false)
  endfunc

  function! twihi#internal#notify#start(message, opt) abort
    let buf = nvim_create_buf(v:false, v:true)
    call nvim_buf_set_lines(buf, 0, -1, v:true, a:message)

    let maxwidth = max(map(copy(a:message), { _, v -> strdisplaywidth(v) }))
    let opts = {
          \ 'relative': 'win',
          \ 'width': maxwidth,
          \ 'height': len(a:message),
          \ 'row': 1,
          \ 'col': &columns - (maxwidth + 2),
          \ 'style': 'minimal',
          \ 'border': map(['╭', '─', '╮', '│', '╯', '─', '╰', '│'], { _, v -> [v, 'Special'] }),
          \ }
    let winid = nvim_open_win(buf, 0, opts)
    call win_execute(winid, 'setlocal ft=' .. a:opt.ft)
    call timer_start(a:opt.time, function('<SID>close_floatwin', [winid]))
  endfunction
else
  function! twihi#internal#notify#start(message, opt) abort
    let maxwidth = max(map(copy(a:message), { _, v -> strdisplaywidth(v) }))
    let winid = popup_notification(a:message, {
          \ 'line': 2,
          \ 'minwidth': maxwidth,
          \ 'col': &columns - (maxwidth + 2),
          \ 'padding': [0,0,0,0],
          \ 'time': a:opt.time,
          \ 'highlight': 'NoneText',
          \ 'borderhighlight': repeat(['Special'], 4),
          \ })
    call win_execute(winid, 'setlocal ft=' .. a:opt.ft)
  endfunction
endif
