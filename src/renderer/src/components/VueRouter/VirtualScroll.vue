<template>
  <h2>Virtual Scroll</h2>
  <div class="outer" @scroll="handle_scroll">
    <div class="list-view-phantom" :style="{ width: virturlwidth + 'px' }"></div>
    <div id="list-view-content">
      <table>
        <tbody>
          <tr>
            <th v-for="ele in virtuallist" :key="ele">{{ ele }}</th>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <h2>Virtual Scroll with Range Bar</h2>
  <input v-model="profile_page" min="0" type="range" step="1" />
  <label>{{ profile_page }}</label>
</template>
<script setup>
import { ref, onMounted } from 'vue'

const virturlwidth = ref(0)
const minwidth = ref(30)
const mincount = ref(20)
const data = ref([])
const virtuallist = ref([])
const profile_page = ref(0)

function handle_scroll(event) {
  const scroll_left = event.target.scrollLeft
  console.log(scroll_left)
  let start = Math.floor(scroll_left / minwidth.value)
  let end = Math.ceil((minwidth.value * mincount.value + scroll_left) / minwidth.value)
  virtuallist.value = data.value.slice(start, end)
  var ele = document.getElementById('list-view-content')
  ele.style.transform = `translate3d(${start * minwidth.value}px, 0, 0)`
}

onMounted(() => {
  for (let i = 0; i < 100; i++) {
    data.value.push(i)
  }
  virturlwidth.value = data.value.length * minwidth.value
  virtuallist.value = data.value.slice(0, mincount.value)
})
</script>
<style lang="less">
.outer {
  min-width: 300px;
  padding: 3px;
  overflow-x: auto;
  position: relative;
  background-color: rgba(#4b5f97, 0.5);
}

.list-view-phantom {
  position: relative;
  left: 0;
  top: 0;
  z-index: -1;
}

th {
  background-color: rgba(94, 7, 182, 0.8);
  color: azure;
  border: azure 1px solid;
  font-weight: 600;
  padding: 5px;
  min-width: 30px;
  height: 20px;
}

input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  outline: none;
  background-color: transparent;
  width: 90%;
  height: 1px;
}

input[type='range']::-webkit-slider-runnable-track {
  -webkit-appearance: none;
  appearance: none;
  height: 10px;
  outline: none;
  border-radius: 40px;
  background-color: rgba(72, 6, 138, 0.8);
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 25px;
  height: 20px;
  background-color: rgb(170, 170, 250);
  border: azure 1px dashed;
  border-radius: 5px;
  transition: background 0.3s ease;
  margin-top: -5px;

  &:hover {
    background: #ba71fb;
  }
}
</style>
