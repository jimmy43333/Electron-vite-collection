<template>
  <div class="term" @wheel.prevent>
    <div ref="xterm" @keyup.ctrl.c="handleCopy"></div>
  </div>
  <!-- <div class="clear_button" @dblclick="clear_viewer">CLEAR</div> -->
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import 'xterm/lib/xterm.js'
import debounce from 'lodash/debounce'
const ansiEscapeRegex = /(?:\x1B[@-_]|[\x80-\x9F])[0-?]*[ -/]*[@-~]/g
const xterm = ref(null)
const scroll_event = ref(null)
const scroll_flag = ref(false)
const current_line = ref(0)

let terminal = new Terminal({
  allowTransparency: true,
  fastScrollSensitivity: 50,
  scrollback: 1000,
  scrollOnUserInput: false,
  disableStdin: true,
  rendererType: 'canvas',
  cursorBlink: true,
  theme: {
    foreground: '#f8f8f2',
    background: '#081518',
    cursor: 'help'
  }
})

const fiton = new FitAddon()

const debouncedResize = debounce(() => {
  fiton.fit()
  console.log('Terminal resized to fit the container.')
}, 200)

const handleScroll = (e) => {
  if (!scroll_flag.value) {
    scroll_flag.value = true
    // console.log(`Scroll First Row: ${e}`)
    current_line.value = e == 0 || e == 1 ? 0 : e + 1
    setTimeout(() => {
      scroll_flag.value = false
    }, 100)
  }
}

const handleCopy = (e) => {
  const selected = terminal.getSelection()
  if (selected) {
    navigator.clipboard.writeText(selected)
    console.log('Copied:', selected)
    e.preventDefault()
  }
}

const props = defineProps({
  namespace: String,
  viewertype: String,
  viewerSubtype: String
})

const refresh_viewer = (event, content) => {
  let lines = content.split('\n')
  let occupied_rows = 0
  lines.forEach((line) => {
    let line_len = line.replace(ansiEscapeRegex, '').replace('\r', '').length
    if (line_len == 0) {
      occupied_rows += 1
    } else {
      occupied_rows += Math.ceil(line_len / terminal.cols)
    }
  })
  if (occupied_rows > terminal.rows) {
    // console.log(`Occupied:${occupied_rows}`)
    terminal.options.scrollback = occupied_rows - terminal.rows
  } else {
    terminal.options.scrollback = 0
  }
  terminal.write('\x1b[2J\x1b[H')
  terminal.write(content, () => {
    terminal.scrollToLine(current_line.value)
  })
  fiton.fit()
}

const append_viewer = (event, content) => {
  if (terminal.options.scrollback != 40000) {
    terminal.clear()
    terminal.options.scrollback = 40000
  }
  terminal.write(content)
  fiton.fit()
}

let ipcID = `update_result_${props.namespace}_Count`
window.electron.ipcRenderer.on(ipcID, refresh_viewer)

ipcID = `update_result_${props.namespace}_Value`
window.electron.ipcRenderer.on(ipcID, refresh_viewer)

ipcID = `update_result_${props.namespace}_Device`
window.electron.ipcRenderer.on(ipcID, refresh_viewer)

ipcID = `update_result_${props.namespace}_Failure`
window.electron.ipcRenderer.on(ipcID, append_viewer)

ipcID = `update_result_${props.namespace}_HeartBeat`
window.electron.ipcRenderer.on(ipcID, append_viewer)

ipcID = `update_result_${props.namespace}_Summary`
window.electron.ipcRenderer.on(ipcID, append_viewer)

onMounted(async () => {
  terminal.loadAddon(fiton)
  terminal.open(xterm.value)
  terminal.resize(terminal.cols, 30)
  scroll_event.value = terminal.onScroll(handleScroll)

  let data = JSON.stringify(props)
  await window.electron.ipcRenderer.send('running_update_viewer', 'start', data)
  window.addEventListener('resize', debouncedResize)
  watch(
    () => [props.viewertype, props.viewerSubtype],
    async ([new_data1, new_data2], [old_data1, old_data2]) => {
      let data = JSON.stringify({
        namespace: props.namespace,
        viewertype: old_data1,
        viewerSubtype: old_data2
      })
      if (props.viewertype == 'Count' || props.viewertype == 'Value') {
        if (!scroll_event.value) {
          scroll_event.value = terminal.onScroll(handleScroll)
        }
      } else {
        if (scroll_event.value) {
          scroll_event.value.dispose()
          scroll_event.value = null
        }
      }
      await window.electron.ipcRenderer.send('running_update_viewer', 'stop', data)
      terminal.reset()
      setTimeout(async () => {
        terminal.clear()
        data = JSON.stringify(props)
        await window.electron.ipcRenderer.send('running_update_viewer', 'start', data)
      }, 300)
    },
    { deep: true, immediate: false }
  )
  console.log('Terminal Mounted Completed')
})

onBeforeUnmount(async () => {
  console.log('UnBeforeUnmount')
  let data = JSON.stringify(props)
  await window.electron.ipcRenderer.send('running_update_viewer', 'stop', data)
  window.removeEventListener('resize', debouncedResize)
  if (scroll_event.value) {
    scroll_event.value.dispose()
  }
  terminal.clear()
  terminal.reset()
})
</script>

<style lang="less">
.term {
  width: 100%;
  padding: 5px;
  min-height: 520px;
  overflow-x: hidden;
  overflow-y: scroll;
}

.clear_button {
  position: absolute;
  top: 50;
  right: 0;
  width: 50px;
  height: 25px;
  font-size: 16px;
  font-weight: 600;
  color: #111111;
  margin: 10px;

  &:hover {
    color: #444444;
  }
}
</style>
