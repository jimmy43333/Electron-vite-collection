<template>
  <h2>Progress with click button:</h2>
  <button @click="move_progress">Move</button>
  <div id="normal-progress">
    <div id="normal-progress-bar"></div>
  </div>
  <h2>Progress with Main ipcMain send:</h2>
  <button @click="start_flowing_progress">Start</button>
  <button @click="reset_flowing_progress">Reset</button>
  <div class="flow-progress">
    <div
      id="flow_progress_id"
      :class="flow_stop ? 'flow-progress-bar' : 'flow-progress-bar flow-flowing'"
    >
      <span class="flow-progress-text">{{ flow_text }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const persent = ref(0)
const flow_text = ref('Infromation text....')
const flow_stop = ref(false)
const flow_action = ref([
  'Check_Start',
  'Check_Stop',
  'Check_Pause',
  'Check_Resume',
  'Check_Start 2',
  'Check_Stop 2',
  'Check_Pause 2',
  'Check_Resume 2',
  'Check_Start 3',
  'Check_Stop 3',
  'Check_Pause 3',
  'Check_Resume 3'
])

function move(persentage) {
  var elem = document.getElementById('normal-progress-bar')
  if (persentage == 0) {
    elem.style.width = '0%'
    message.value = ''
    return
  }
  var parent = elem.parentNode
  var width = Math.floor((elem.offsetWidth / parent.offsetWidth) * 100)
  // console.log(width)
  var id = setInterval(frame, 10)
  function frame() {
    if (width >= persentage) {
      clearInterval(id)
    } else {
      width++
      elem.style.width = width + '%'
    }
  }
}

function move_progress() {
  if (persent.value == 100) {
    persent.value = 0
  } else {
    persent.value += 30
  }
  if (persent.value > 100) {
    persent.value = 100
  }
  move(persent.value)
}

function start_flowing_progress() {
  window.electron.ipcRenderer.send('flowing_progress', JSON.stringify(flow_action.value))
}

function reset_flowing_progress() {
  var elem = document.getElementById('flow_progress_id')
  elem.style.width = '0%'
}

window.electron.ipcRenderer.on('update_flowing_progress', (event, arg) => {
  // {Key: , result: true/false, message: }
  let index = flow_action.value.indexOf(arg.key) + 1
  if (index) {
    let persentage = (index / flow_action.value.length) * 100
    var elem = document.getElementById('flow_progress_id')
    elem.style.width = persentage + '%'
    if (persentage == 100) {
      flow_stop.value = true
    }
  }
  console.log(arg.message)
  flow_text.value = arg.message
})
</script>

<style lang="less">
/* ===========================
  Progress Bar Type Normal
============================== */

#normal-progress {
  width: 80%;
  height: 12px;
  background-color: rgba(grey, 0.2);
  border-radius: 10px;
  padding: 2px;
  margin: 10px;
}

#normal-progress-bar {
  width: 0%;
  height: 10px;
  background-color: rgba(CadetBlue, 0.5);
  border-radius: 10px;
}

/* ===========================
  Progress Bar Type Expand
============================== */

.expand-progress {
  position: absolute;
  top: 50%;
  height: 2px;
  background: #af71af;
}

.expand-progress-done {
  top: 0;
  height: 100%;
  width: 100%;
  transition: all 0.33s ease;
}

.count {
  position: absolute;
  top: 50%;
  width: 100%;
  text-align: center;
  font-weight: 100;
  font-size: 3em;
  margin-top: -1.33em;
  color: #af71af;
}

/* ===========================
  Mixins
============================== */

.box-shadow(@shadow) {
  -webkit-box-shadow: @shadow;
  -moz-box-shadow: @shadow;
  box-shadow: @shadow;
}

.transition(@transition) {
  -webkit-transition: @transition;
  -moz-transition: @transition;
  -o-transition: @transition;
  transition: @transition;
}

.gradient-vertical(@start-color; @end-color; @start-percent: 0%; @end-percent: 100%) {
  background-image: -webkit-linear-gradient(
    top,
    @start-color @start-percent,
    @end-color @end-percent
  );
  background-image: linear-gradient(
    to bottom,
    @start-color @start-percent,
    @end-color @end-percent
  );
}
.gradient-striped(@color1; @color2; @angle: 45deg) {
  background-image: -webkit-linear-gradient(
    @angle,
    @color1 30%,
    @color2 30%,
    @color2 33%,
    transparent 33%,
    transparent 46%,
    @color2 46%,
    @color2 50%,
    @color1 50%,
    @color1 80%,
    @color2 80%,
    @color2 83%,
    transparent 83%,
    transparent 97%,
    @color2 97%,
    @color2
  );
  background-image: linear-gradient(
    @angle,
    @color1 30%,
    @color2 30%,
    @color2 34%,
    transparent 34%,
    transparent 46%,
    @color2 46%,
    @color2 50%,
    @color1 50%,
    @color1 80%,
    @color2 80%,
    @color2 84%,
    transparent 84%,
    transparent 96%,
    @color2 96%,
    @color2
  );
}

/* ============================
  Progress Bar Type Flowing
=============================== */

// ANIMATIONS
@-webkit-keyframes progress-bar-animate {
  from {
    background-position: 40px 0;
  }
  to {
    background-position: 0 0;
  }
}

@keyframes progress-bar-animate {
  from {
    background-position: 40px 0;
  }
  to {
    background-position: 0 0;
  }
}

// outer container
.flow-progress {
  overflow: hidden;
  width: 80%;
  height: 30px;
  margin: 10px;
  border-radius: 10px;
  .gradient-vertical(#ccc, #ddd);
  .box-shadow(inset 0 1px 2px rgba(0,0,0,0.1));

  // inner progress bar
  &-bar {
    width: 100%;
    height: 100%;
    float: left;
    box-sizing: border-box;
    background-color: CadetBlue;
    background-size: 10px 10px;
    border-radius: 10px 0 0 10px;
    .gradient-striped(rgba(255,255,255,0.1); rgba(0,0,0,0.1));
    .box-shadow(inset 0 -1px 0 rgba(0,0,0,0.1));
    .transition(width 200ms ease);

    &.flow-flowing {
      -webkit-animation: progress-bar-animate 1s linear infinite;
      animation: progress-bar-animate 1s linear infinite;
    }
  }

  &-text {
    width: 1000px;
    line-height: 30px;
    padding: 0 10px;
    color: black;
    background-color: #af71af;
  }
}
</style>
