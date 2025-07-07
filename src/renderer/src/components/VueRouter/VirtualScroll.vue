<template>
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
  <input v-model="profile_page" min="0" type="range" step="1" />
  <label>{{ profile_page }}</label>
  <div class="rel_box">
    <div class="rel_inner"></div>
    <div class="sticky_box">AAAA</div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'

const virturlwidth = ref(0)
const minwidth = ref(30)
const mincount = ref(10)
const data = ref([])
const virtuallist = ref([])
const profile_page = ref(0)

function handle_scroll(event) {
  const scroll_left = event.target.scrollLeft
  console.log(scroll_left)
  let start = Math.floor(scroll_left / minwidth.value)
  let end = Math.ceil((minwidth.value * mincount.value + scroll_left) / minwidth.value)
  //   const entries = Object.entries(profile.value) // Convert object to entries array
  //   const slicedEntries = entries.slice(start, end) // Slice the entries array
  //   virturllist.value = Object.fromEntries(slicedEntries)
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
  min-width: 500px;
  overflow-x: auto;
  margin: 30px;
  border-radius: 10px;
  position: relative;
}

.list-view-phantom {
  position: relative;
  left: 0;
  top: 0;
  z-index: -1;
  background-color: blue;
}

.list-view-content {
  background-color: honeydew;
}

th {
  background-color: rgba(121, 29, 211, 0.3);
  color: azure;
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
  background: darkblue;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background-color: tomato;
  border-radius: 50%;
  transition: background 0.3s ease;
  margin-top: -3px;

  &:hover {
    background: #45a049;
  }
}

.rel_box {
  position: relative;
  width: 90%;
  height: 400px;
  margin: 10px;
  overflow: scroll;
}

.rel_inner {
  position: relative;
  width: 100%;
  height: 600px;
  background-color: lightblue;
}

.sticky_box {
  position: sticky;
  top: 20px;
  left: 50px;
  width: 100px;
  height: 100px;
  padding: 20px;
  color: black;
  background-color: #45a049;
}
</style>
