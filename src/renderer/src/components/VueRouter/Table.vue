<template>
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
</template>
<script setup>
import { ref } from 'vue'
const message = ref('Hello')

window.electron.ipcRenderer.on('update_test_data', (event, data) => {
  console.log('Update Device !!')
  message.value = data
})
</script>
<style lang="less">
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
</style>
