<template>
  <div class="run-python-content">
    <h2>Execute Python Script</h2>
    <div class="loading-box">
      <button :disabled="demo1.running" @click="run_demo('demo.py', 1)">Run Demo 1</button>
      <div v-if="demo1.running" class="loader"></div>
      <div v-if="demo1.result" class="python-result">{{ demo1.result }}</div>
    </div>
    <div class="loading-box">
      <button :disabled="demo2.running" @click="run_demo('demo2.py', 2)">Run Demo 2</button>
      <div v-if="demo2.running" class="loader-2"></div>
      <div v-if="demo2.result" class="python-result">{{ demo2.result }}</div>
    </div>
    <h2>Execute Python and handle structure data</h2>
    <div class="loading-box">
      <button :disabled="demo3.running" @click="run_demo3">Run Demo 3</button>
      <div v-if="demo3.running" class="loader-3"></div>
    </div>
    <div v-if="demo3.result" class="python-result">{{ demo3.result }}</div>
    <h2>Execute Python and keep update progress</h2>
    <div class="loading-box">
      <button :disabled="demo4.running" @click="run_demo_stream('demo2.py')">Run Demo 2</button>
      <div v-if="demo4.running" class="loader-3"></div>
    </div>
    <div v-if="demo4.result" class="python-result">{{ demo4.result }}</div>
    <div v-if="stepInfo.total > 0" class="stepper-bar">
      <div class="stepper-circles">
        <template v-for="n in stepInfo.total" :key="n">
          <div class="stepper-item">
            <div
              class="stepper-circle"
              :class="{
                active: n < stepInfo.current,
                current: n === stepInfo.current
              }"
            >
              <template v-if="n < stepInfo.current">
                <span class="stepper-check">&#10003;</span>
              </template>
              <template v-else-if="n === stepInfo.current">
                <span class="stepper-running">
                  <span class="circle-loader"></span>
                </span>
              </template>
              <template v-else>
                {{ n }}
              </template>
            </div>
            <div class="stepper-label-under">Step {{ n }}</div>
          </div>
          <div
            v-if="n < stepInfo.total"
            class="stepper-line"
            :class="{ active: n < stepInfo.current }"
          ></div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
const demo1 = ref({ running: false, result: '' })
const demo2 = ref({ running: false, result: '' })
const demo3 = ref({ running: false, result: '' })
const demo4 = ref({ running: false, result: '' })
const stepInfo = ref({ current: 3, total: 4 })

function run_demo(script_name, flag) {
  const demo = flag === 1 ? demo1 : demo2
  demo.value.running = true
  demo.value.result = ''
  window.electron.ipcRenderer.invoke('run-python', script_name).then((result) => {
    console.log('Python script executed successfully:', result)
    demo.value.result = result
    demo.value.running = false
  })
}

function run_demo3() {
  demo3.value.running = true
  demo3.value.result = ''
  window.electron.ipcRenderer
    .invoke('run-python', 'demo3.py')
    .then((result) => {
      console.log('Python script executed successfully:', result)
      demo3.value.running = false
      // Assuming the result is a JSON string, you can parse it if needed
      try {
        const parsedResult = JSON.parse(result)
        console.log('Parsed Result:', parsedResult)
        demo3.value.result = parsedResult
      } catch (error) {
        console.error('Error parsing result:', error)
      }
    })
    .catch((error) => {
      console.error('Error executing Python script:', error)
    })
}

function run_demo_stream(script_name) {
  demo4.value.running = true
  demo4.value.result = ''
  window.electron.ipcRenderer.send('run-python-stream', script_name)

  window.electron.ipcRenderer.on('python-progress', (event, data) => {
    console.log('Python Progress Received data:', data)
    demo4.value.result += `${data}\n` // Append new output
  })

  window.electron.ipcRenderer.once('python-done', (event, code) => {
    demo4.value.running = false
    console.log(`\nProcess exited with code ${code}`)
  })
}

onMounted(() => {
  console.log(' component mounted')
})
</script>

<style lang="less">
.run-python-content {
  width: 100%;
  height: 100%;
  padding: 50px;
  overflow: auto;
}

.loading-box {
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: left;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #eee;
  color: #888;
  border: 1px solid #ccc;
}

.python-result {
  width: 70%;
  height: auto;
  max-height: 150px;
  background-color: rgba(#000, 0.3);
  padding: 10px;
  border-radius: 5px;
  overflow-y: auto;
}

/* HTML: <div class="loader"></div> */
.loader {
  height: 30px;
  margin: 10px;
  aspect-ratio: 1.5;
  box-sizing: border-box;
  background:
    radial-gradient(farthest-side, #fff 98%, #0000) left/10px 10px,
    radial-gradient(farthest-side, #fff 98%, #0000) left/10px 10px,
    radial-gradient(farthest-side, #fff 98%, #0000) center/10px 10px,
    radial-gradient(farthest-side, #fff 98%, #0000) right/10px 10px;
  background-repeat: no-repeat;
  // filter: blur(4px) contrast(10);
  animation: l14 1s infinite;
}

@keyframes l14 {
  100% {
    background-position: right, left, center, right;
  }
}

/* HTML: <div class="loader"></div> */
.loader-2 {
  width: 35px;
  aspect-ratio: 1;
  --_g: no-repeat radial-gradient(farthest-side, #000 94%, #0000);
  background:
    var(--_g) 0 0,
    var(--_g) 100% 0,
    var(--_g) 100% 100%,
    var(--_g) 0 100%;
  background-size: 40% 40%;
  animation: l38 0.5s infinite;
}
@keyframes l38 {
  100% {
    background-position:
      100% 0,
      100% 100%,
      0 100%,
      0 0;
  }
}

/* HTML: <div class="loader"></div> */
.loader-3 {
  margin: 0px 20px;
  --d: 15px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  color: #2590b0;
  box-shadow:
    calc(1 * var(--d)) calc(0 * var(--d)) 0 0,
    calc(0.707 * var(--d)) calc(0.707 * var(--d)) 0 1px,
    calc(0 * var(--d)) calc(1 * var(--d)) 0 1px,
    calc(-0.707 * var(--d)) calc(0.707 * var(--d)) 0 1px,
    calc(-1 * var(--d)) calc(0 * var(--d)) 0 1px,
    calc(-0.707 * var(--d)) calc(-0.707 * var(--d)) 0 2px,
    calc(0 * var(--d)) calc(-1 * var(--d)) 0 3px;
  animation: l27 1s infinite steps(8);
}
@keyframes l27 {
  100% {
    transform: rotate(1turn);
  }
}

.stepper-bar {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.stepper-circles {
  display: flex;
  align-items: flex-end;
}
.stepper-item {
  width: 60px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  // background-color: #888;
}
.stepper-circle {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  // border: 2px solid #b0b0b0;
  transition:
    background 0.2s,
    color 0.2s,
    border 0.2s;
  overflow: hidden;
}
.stepper-circle.active {
  background: #2590b0;
  color: #fff;
  border-color: #2590b0;
}
.stepper-circle.current {
  box-shadow: 0 0 0 3px #2590b055;
}
.stepper-check {
  color: #fff;
  font-size: 15px;
  font-weight: bold;
}
.stepper-running {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.circle-loader {
  display: block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top: 2px solid #2590b0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  padding: 3px;
  margin: 0; // Remove any margin
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
.stepper-label-under {
  margin-top: 4px;
  font-size: 16px;
  font-weight: bold;
  color: #2590b0;
  text-align: center;
  min-width: 40px;
}

.stepper-line {
  width: 40px;
  height: 6px;
  background: #e0e0e0;
  margin: 0 2px 40px 2px;
  border-radius: 6px;
  align-self: flex-end;
}

.stepper-line.active {
  background: #2590b0;
}

.stepper-circle.active {
  background: #2590b0;
}
</style>
