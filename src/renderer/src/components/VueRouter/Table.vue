<template>
  <div class="table-container">
    <h2>Example 1</h2>
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

    <h2>Example 2</h2>
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

    <h2>Example 3</h2>
    <div class="outbox-3">
      <div class="inbox-3-left">
        <button @click="panel_flag = true">Open panel</button>
        <div class="content-aside">
          <p>Inbox Message 1</p>
          <p>{{ long_message }}</p>
        </div>
        <div class="content-middle">
          <p>Inbox Message 2</p>
          <p>{{ long_message }}</p>
          <p>{{ long_message }}</p>
          <p>{{ long_message }}</p>
          <p>{{ long_message }}</p>
          <p>{{ long_message }}</p>
          <p>{{ long_message }}</p>
        </div>
        <div class="content-aside">
          <div>Inbox Message 3</div>
          <div>{{ long_message }}</div>
          <div>{{ long_message }}</div>
        </div>
      </div>
      <div v-if="panel_flag" class="inbox-3-right">
        <button @click="panel_flag = false">Close panel</button>
      </div>
    </div>

    <h2>Example 4</h2>
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

// Example 2 //////////////////////////////////////
.outbox {
  width: 90%;
  height: 400px;
  margin: 20px 0px;
  padding: 5px;
  background-color: #1d65a6;
  border: 1px solid #ccc;
  box-sizing: border-box;
  overflow: scroll;
}

.inbox {
  width: auto;
  height: auto;
  background-color: #72a2c0;
  box-sizing: border-box;
  overflow-x: scroll;
  display: flex;
  align-items: center;
}

.content {
  min-width: 200px;
  margin: 10px;
  box-sizing: border-box;
  background-color: #192e5b;
  overflow-x: visible;
  display: flex;
  flex-direction: column;

  p {
    min-width: 0;
    color: #f9f9f9;
    font-size: 12px;
    margin: 0;
    padding: 5px;
    white-space: normal;
    overflow-wrap: break-word;
  }
}

///////////////////////////////////////////////////

// Example 3 //////////////////////////////////////
.outbox-3 {
  width: 90%;
  height: 400px;
  display: flex;
  overflow-y: auto; /* 滾動整個容器 */
  background-color: #8d2f23;
}

.inbox-3-left {
  flex: 1 1 0;
  min-width: 0;
  background-color: rgba(255, 238, 0, 0.5);
  margin: 10px;
}

.inbox-3-right {
  width: 100px;
  flex-shrink: 0;
  overflow-x: hidden; /* 水平溢出隱藏 */
  background-color: rgba(255, 238, 0, 0.5);
  margin: 10px;
}

.content-aside {
  max-width: 100%;
  background-color: #561e18;
  box-sizing: border-box;
  margin: 10px;
  padding: 10px;
}

.content-middle {
  max-width: 100%;
  display: flex;
  background-color: #561e18;
  margin: 10px;
  overflow: scroll; /* 水平溢出隱藏 */

  p {
    min-width: 150px;
    background-color: #212027;
    font-size: 12px;
    margin: 10px;
    padding: 5px;
    white-space: normal;
  }
}

///////////////////////////////////////////////////

// Example 4 //////////////////////////////////////
.dut-version-box {
  width: 90%;
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
  scrollbar-width: none;

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
  width: 30px;
  height: 60px;
  margin: 0 5px;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: cadetblue;
  }
}
</style>
