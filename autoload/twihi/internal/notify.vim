" notify
" Author: skanehira
" License: MIT

" show notification using popup/float window
" @param {string[]} message - notification message
" @param {object} opt - option for create notification
" @param {number} opt.time - until close window time(msec)
" @param {string} opt.ft - buffer's file type
if has('nvim')
  func s:close_floatwin(winid, timer) abort
    call nvim_win_close(a:winid, v:false)
  endfunc

  function! twihi#internal#notify#start(message, opt) abort
    let buf = nvim_create_buf(v:false, v:true)
    call nvim_buf_set_lines(buf, 0, -1, v:true, a:message)
    let winid = nvim_open_win(buf, 0, {
          \ 'relative': 'editor',
          \ 'width': 40,
          \ 'height': 6,
          \ 'row': 1,
          \ 'col': &columns - (40 + 2),
          \ 'style': 'minimal',
          \ 'border': map(['╭', '─', '╮', '│', '╯', '─', '╰', '│'], { _, v -> [v, 'Special'] }),
          \ })
    call win_execute(winid, 'setlocal ft=' .. a:opt.ft)
    call nvim_win_set_option(winid, 'winhighlight', 'Normal:NONE')
    call timer_start(a:opt.time, function('<SID>close_floatwin', [winid]))
  endfunction
else
  function! twihi#internal#notify#start(message, opt) abort
    let winid = popup_notification(a:message, {
          \ 'line': 2,
          \ 'minwidth': 40,
          \ 'maxheight': 6,
          \ 'col': &columns - (40 + 2),
          \ 'padding': [0, 0, 0, 0],
          \ 'time': a:opt.time,
          \ 'highlight': 'NoneText',
          \ 'borderhighlight': repeat(['Special'], 4),
          \ 'scrollbar': v:false,
          \ 'borderchars': ['─', '│', '─', '│', '╭', '╮', '╯', '╰'],
          \ })
    call win_execute(winid, 'setlocal ft=' .. a:opt.ft)
  endfunction
endif
