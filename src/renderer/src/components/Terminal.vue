<template>
  <div class="terminal-outer">
    <h2>Update Terminal with watch files</h2>
    <div class="input-group-sm mb-2">
      <input id="t-m-s" v-model="mode" type="radio" class="btn-check" value="Stop" />
      <label class="btn btn-outline-secondary group-buttons" for="t-m-s">Stop</label>
      <input id="t-m-r" v-model="mode" type="radio" class="btn-check" value="Refresh" />
      <label class="btn btn-outline-secondary group-buttons" for="t-m-r">Refresh</label>
      <input id="t-m-a" v-model="mode" type="radio" class="btn-check" value="Append" />
      <label class="btn btn-outline-secondary group-buttons" for="t-m-a">Append</label>
    </div>
    <div class="term" @wheel.prevent>
      <div ref="xterm" @keyup.ctrl.c="handleCopy"></div>
    </div>
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
const mode = ref('Stop')

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

window.electron.ipcRenderer.on('update_refresh', refresh_viewer)
window.electron.ipcRenderer.on('update_append', append_viewer)

watch(
  mode,
  async (newMode, oldMode) => {
    console.log('Terminal mode changed:', oldMode, '→', newMode)
    if (mode.value == 'Refresh') {
      if (!scroll_event.value) {
        scroll_event.value = terminal.onScroll(handleScroll)
      }
    } else {
      if (scroll_event.value) {
        scroll_event.value.dispose()
        scroll_event.value = null
      }
    }
    await window.electron.ipcRenderer.send('terminal_control', 'stop', oldMode)
    terminal.reset()
    setTimeout(async () => {
      terminal.clear()
      await window.electron.ipcRenderer.send('terminal_control', 'start', newMode)
    }, 300)
  },
  { deep: true, immediate: false }
)

onMounted(async () => {
  terminal.loadAddon(fiton)
  terminal.open(xterm.value)
  terminal.resize(terminal.cols, 10)
  scroll_event.value = terminal.onScroll(handleScroll)
  window.addEventListener('resize', debouncedResize)
  console.log('Terminal Mounted Completed')
})

onBeforeUnmount(async () => {
  console.log('UnBeforeUnmount')
  window.removeEventListener('resize', debouncedResize)
  if (scroll_event.value) {
    scroll_event.value.dispose()
  }
  terminal.clear()
  terminal.reset()
})
</script>

<style lang="less">
.terminal-outer {
  position: relative;
  width: 100%;
  min-height: 300px;
  padding: 50px;
  overflow-y: hidden;
}

.term {
  width: 100%;
  padding: 5px;
  min-height: 300px;
  overflow-x: hidden;
  overflow-y: scroll;
  user-select: text;
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

.group-buttons {
  font-weight: 600;
}
</style>
