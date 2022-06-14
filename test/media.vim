let s:suite = themis#suite('twihi')
let s:assert = themis#helper('assert')

" wait for denops starting
while denops#server#status() !=# 'running'
  sleep 1
endwhile

function s:suite.media_remove()
  let b:twihi_medias = ["file1", "file2", "file3"]
  call twihi#media_remove("file1", "file2")
  call s:assert.equals(b:twihi_medias, ["file3"])
endfunction

function s:suite.media_clear()
  let b:twihi_medias = ["file1", "file2"]
  call twihi#media_clear()
  call s:assert.equals(b:twihi_medias, [])
endfunction

function s:suite.media_add()
  let b:twihi_medias = []
  let f = 'test.png'
  call twihi#media_add(f)
  call s:assert.equals(b:twihi_medias, [f])
endfunction

function s:suite.media_add_max()
  let b:twihi_medias = []
  let f = ['1.png', '2.png']
  let f2 = ['3.png', '4.png']
  call call('twihi#media_add', f)
  call call('twihi#media_add', f2)
  call s:assert.equals(b:twihi_medias, f+f2)
endfunction

function s:suite.media_add_over()
  let b:twihi_medias = []
  call twihi#media_add('1.png')
  call twihi#media_add('2.png', '3.png', '4.png', '5.png')
  call s:assert.equals(b:twihi_medias, ['1.png'])
endfunction

function s:write_media_to_clipboard() abort
  call system('osascript -e "set the clipboard to (read \"denops/twihi/testdata/test.png\" as TIFF picture)"')
endfunction

function s:suite.media_add_from_clipboard()
  let b:twihi_medias = []
  call s:write_media_to_clipboard()
  call twihi#media_add_from_clipboard()
  let result = twihi#media_complete('','','')
  call s:assert.equals(b:twihi_medias, result)
  call s:assert.equals(len(b:twihi_medias), 1)
endfunction

function s:suite.media_add_from_clipboard_over()
  let b:twihi_medias = []
  call s:write_media_to_clipboard()
  let i = 0
  while i <= 4
    call twihi#media_add_from_clipboard()
    let i+=1
  endwhile
  call s:assert.equals(len(b:twihi_medias), 4)
endfunction
