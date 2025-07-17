<template>
  <div class="table-container">
    <div class="grid-table">
      <div class="header">Header 1</div>
      <div class="grid-inside">
        <div class="cell">Row 1, Col 1</div>
        <div class="header">Header 1</div>
        <div class="cell">Row 1, Col 1</div>
      </div>
      <div class="header">Header 2</div>
      <div class="cell">{{ message }}</div>
      <div class="header">Header 3</div>
      <div class="cell">Row 1, Col 1</div>
      <div class="header">Header 4</div>
      <div class="cell">Row 1, Col 1</div>
    </div>

    <div class="outbox">
      <div class="inbox">
        <div v-for="i in 10" :key="i" class="content">
          <p>Inbox Message {{ i + 1 }}</p>
          <p>{{ long_message }}</p>
          <p>{{ long_message }}</p>
          <p>{{ long_message }}</p>
          <p>{{ long_message }}</p>
          <p>{{ long_message }}</p>
        </div>
      </div>
    </div>

    <div class="outbox2">
      <div class="inbox2">
        <button @click="panel_flag = true">Open panel</button>
        <div class="content-box">
          <div class="content2">
            <p>Inbox Message 1</p>
            <p>{{ long_message }}</p>
            <p>{{ long_message }}</p>
            <p>{{ long_message }}</p>
            <p>{{ long_message }}</p>
            <p>{{ long_message }}</p>
          </div>
          <div class="content3">
            <p>Inbox Message 2</p>
            <p>{{ long_message }}</p>
            <p>{{ long_message }}</p>
            <p>{{ long_message }}</p>
            <p>{{ long_message }}</p>
          </div>
        </div>
      </div>
      <div v-if="panel_flag" class="control-panel">
        <button @click="panel_flag = false">Close panel</button>
      </div>
    </div>

    <div class="dut-version-box">
      <div class="dut-version-scroll-controls">
        <button class="scroll-btn" @click="scrollDutVersion('left')">&lt;</button>
        <div ref="dutVersionBlock" class="dut-version-block">
          <div v-for="i in 10" :key="i" class="dut-version-block-item">
            <template v-for="j in 10" :key="j">
              <div class="version-key">{{ j }}</div>
              <div class="version-value">value</div>
            </template>
          </div>
        </div>
        <button class="scroll-btn" @click="scrollDutVersion('right')">&gt;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const message = ref('Hello')
const long_message = ref(
  'This is a long message that will be displayed in the inbox section.It can contain more text to demonstrate how it looks when there is more content.'
)
const panel_flag = ref(true)

window.electron.ipcRenderer.on('update_test_data', (event, data) => {
  console.log('Update Device !!')
  message.value = data
})

const dutVersionBlock = ref(null)
function scrollDutVersion(direction) {
  const el = dutVersionBlock.value
  if (!el) return
  const scrollAmount = 200 // px per click
  if (direction === 'left') {
    el.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
  } else {
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }
}
</script>

<style lang="less">
.table-container {
  width: 100%;
  height: 100%;
  overflow: scroll;
}

.grid-table {
  width: 80%;
  display: grid;
  grid-template-columns: 150px 1fr; /* 3 columns, each taking equal space */
  gap: 1px; /* Space between cells */
  background-color: #ccc; /* Separator color */
}

.grid-inside {
  display: grid;
  grid-template-columns: 1fr 150px 1fr; /* 3 columns, each taking equal space */
  gap: 1px; /* Space between cells */
  background-color: #ccc; /* Separator color */
}

.header {
  background-color: rgba(darkblue, 0.2);
  color: black;
  font-weight: bold;
  text-align: center;
  padding: 10px;
}

.cell {
  background-color: #333;
  color: #f9f9f9;
  padding: 10px;
  text-align: center;
}

.outbox {
  width: 80%;
  height: 300px;
  background-color: #0f1044;
  border: 1px solid #ccc;
  margin: 20px 0px;
  padding: 5px;
  overflow: scroll;
  white-space: nowrap;
  position: relative;
}

.inbox {
  width: auto;
  height: auto;
  display: flex;
  align-items: center;
  overflow-x: scroll;
  background-color: rgba(255, 238, 0, 0.432);
}

.content {
  min-width: 150px;
  background-color: rgb(0, 0, 0);
  margin: 10px;
  display: flex;
  flex-direction: column;
  overflow-x: visible;

  p {
    color: #f9f9f9;
    font-size: 12px;
    margin: 0;
    padding: 5px;
    white-space: normal;
  }
}

.outbox2 {
  width: 80%;
  height: 300px;
  display: flex;
  overflow-y: auto; /* 滾動整個容器 */
  background-color: #0f1044;
}

.inbox2 {
  flex: 1 1 0;
  min-width: 0;
  background-color: rgba(255, 238, 0, 0.432);
  margin: 10px;
}

.content-box {
  width: auto;
  height: auto;
  overflow-x: scroll;
  background-color: rgba(248, 186, 186, 0.527);
}

.content2 {
  max-width: 100%;
  display: flex;
  flex-direction: column;
  background-color: black;
  margin: 10px;
}

.content3 {
  max-width: 100%;
  display: flex;
  // flex-direction: column;
  background-color: tomato;
  margin: 10px;
  overflow: scroll; /* 水平溢出隱藏 */

  p {
    background-color: black;
    font-size: 12px;
    margin: 10px;
    padding: 5px;
    white-space: normal;
  }
}

.control-panel {
  width: 100px;
  flex-shrink: 0;
  overflow-x: hidden; /* 水平溢出隱藏 */
  background-color: rgba(255, 238, 0, 0.432);
  margin: 10px;
}

.dut-version-box {
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: rgba(aliceblue, 0.1);
  padding: 10px 20px;
  margin: 20px 0px;
}

.dut-version-scroll-controls {
  display: flex;
  align-items: center;
  width: 100%;
}

.dut-version-block {
  max-width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  overflow-x: auto;
  // scrollbar-width: none;

  &-item {
    padding: 10px;
    display: flex;
    flex-direction: column;
    margin: 5px;
  }

  .version-key {
    margin-top: 10px;
    padding: 5px;
    background-color: #002e38;
    color: rgba(azure, 0.8);
    font-size: 12px;
    white-space: normal;
  }

  .version-value {
    padding: 5px;
    background-color: #222222;
    color: rgba(azure, 0.8);
    font-size: 12px;
    font-weight: 600;
    white-space: normal;
  }
}

.scroll-btn {
  background: rgba(30, 72, 78, 0.7);
  color: #fff;
  border: none;
  border-radius: 5px;
  width: 32px;
  height: 32px;
  margin: 0 5px;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: cadetblue;
  }
}
</style>
