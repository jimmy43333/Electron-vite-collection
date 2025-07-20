<template>
  <div class="draggable-box">
    <h2>Typical drag between two table</h2>
    <div style="display: flex">
      <button @click="show_array">Show</button>
      <button @click="lock = !lock">{{ lock_message }}</button>
    </div>
    <div style="display: flex">
      <div class="typical-box">
        <h6>Name</h6>
        <draggable
          v-model="name_array"
          animation="200"
          item-key="id"
          group="description"
          @start="drag = true"
          @end="drag = false"
        >
          <template #item="{ element }">
            <div class="typical">{{ element.name }}</div>
          </template>
        </draggable>
      </div>
      <div class="typical-box">
        <h6>Flower</h6>
        <draggable
          v-model="flower_array"
          item-key="order"
          animation="200"
          ghost-class="ghost"
          :disabled="lock"
          group="description"
        >
          <template #item="{ element }">
            <div :key="element.id" class="typical">{{ element.name }}</div>
          </template>
        </draggable>
      </div>
    </div>
    <h2>Drag with handle icon</h2>
    <button @click="restore_handle">Restore</button>
    <div class="handle-box">
      <draggable tag="ul" :list="subject_array" class="h-out" handle=".handle" item-key="name">
        <template #item="{ element, index }">
          <li class="h-item">
            <ion-icon :icon="reorderFour" class="handle" />
            <span class="h-title">{{ element.name }} </span>
            <input v-model="element.score" type="text" class="h-input" />
            <ion-icon :icon="closeOutline" class="h-remove" @click="removeAt(index)" />
          </li>
        </template>
      </draggable>
    </div>
    <h2>Table draggable column</h2>
    <table class="table table-striped">
      <thead class="thead-dark">
        <draggable v-model="headers" tag="tr" :item-key="(key) => key">
          <template #item="{ element: header }">
            <th scope="col">
              {{ header }}
            </th>
          </template>
        </draggable>
      </thead>
      <tbody>
        <tr v-for="item in test_array" :key="item.name">
          <td v-for="header in headers" :key="header">{{ item[header] }}</td>
        </tr>
      </tbody>
    </table>
    <h2>Transition</h2>
    <p>Can't not work with Vue 3</p>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import draggable from 'vuedraggable'
import { IonIcon } from '@ionic/vue'
import { reorderFour, closeOutline } from 'ionicons/icons'

const name_array = ref([
  { id: 1, name: 'Jimmy' },
  { id: 2, name: 'Jeff' },
  { id: 3, name: 'John' },
  { id: 4, name: 'Jack' }
])

const flower_array = ref([
  { id: 5, order: 1, name: 'Rose' },
  { id: 6, order: 2, name: 'Tulip' },
  { id: 7, order: 3, name: 'Daisy' },
  { id: 8, order: 4, name: 'Sunflower' }
])

const subject_array = ref([
  { id: 1, name: 'Math', score: 90 },
  { id: 2, name: 'Science', score: 85 },
  { id: 3, name: 'History', score: 88 },
  { id: 4, name: 'Art', score: 92 }
])

const headers = ref(['name', 'voltage', 'current'])
const test_array = ref([
  { id: 1, name: 'Test 1', voltage: 95, current: 10 },
  { id: 2, name: 'Test 2', voltage: 80, current: 15 },
  { id: 3, name: 'Test 3', voltage: 75, current: 20 },
  { id: 4, name: 'Test 4', voltage: 90, current: 25 },
  { id: 5, name: 'Test 5', voltage: 90, current: 100 }
])

const drag = ref(false)
const lock = ref(false)
const lock_message = computed(() => {
  return lock.value ? 'Unlocked' : 'Locked Flower'
})

function show_array() {
  console.log(name_array.value)
}

function restore_handle() {
  subject_array.value = [
    { id: 1, name: 'Math', score: 90 },
    { id: 2, name: 'Science', score: 85 },
    { id: 3, name: 'History', score: 88 },
    { id: 4, name: 'Art', score: 92 }
  ]
}

function removeAt(index) {
  subject_array.value.splice(index, 1)
}

onMounted(() => {
  console.log(' component mounted')
})
</script>

<style lang="less">
.draggable-box {
  width: 100%;
  height: 100%;
  padding: 30px;
  overflow-y: scroll;
}

.typical-box {
  width: 50%;
  height: auto;
  border: 1px solid #ccc;
  margin: 10px;
  padding: 10px;
  box-sizing: border-box;
}

.typical {
  width: 100%;
  height: 50px;
  line-height: 50px;
  background-color: #565656;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  text-align: center;
  cursor: move;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  user-select: none;
}

.ghost {
  opacity: 0.5;
  background: #637b86;
}

.flip-list-move {
  transition: transform 8s;
}

.handle-box {
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.handle {
  float: left;
  color: #333;
  font-size: 30px;
}

.h-out {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: auto;
  padding: 10px;
  box-sizing: border-box;
}

.h-item {
  width: 50%;
  height: 50px;
  line-height: 50px;
  background-color: #e0e0e0;
  border: 1px solid #ccc;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.h-title {
  width: 100px;
  padding-left: 10px;
  color: #333;
  font-size: 16px;
  font-weight: bold;
  user-select: none;
}

.h-input {
  flex: 1;
  width: 100px;
  height: 40px;
  border: none;
  margin-right: 10px;
}

.h-remove {
  cursor: pointer;
  color: #333;
  font-size: 30px;
  padding: 10px;

  &:hover {
    color: darkred;
  }
}

.thead-dark th {
  background-color: #343a40 !important;
  color: #fff !important;
}
</style>
