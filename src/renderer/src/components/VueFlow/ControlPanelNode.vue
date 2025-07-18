<template>
  <Panel position="top-left">
    <div class="control-main-area">
      <Icon id="add_node" @click="node_config = true" />
      <Icon id="style_config" @click="style_config = !style_config" />
      <Icon id="snapshot" />
      <Icon id="export" @click="emit('export_graph')" />
    </div>
    <div v-if="node_config" class="control-node-area">
      <input v-model="node_id" type="text" />
      <button @click="add_node">ADD</button>
    </div>
    <div v-if="style_config" class="control-setting-area">
      <div>
        <label class="label" for="draggable">
          Nodes Draggable
          <input
            id="draggable"
            v-model="nodesDraggable"
            type="checkbox"
            class="vue-flow__draggable"
          />
        </label>
      </div>
      <div>
        <label class="label" for="zoomonscroll">
          Zoom OnScroll
          <input
            id="zoomonscroll"
            v-model="zoomOnScroll"
            type="checkbox"
            class="vue-flow__zoomonscroll"
          />
        </label>
      </div>
      <div>
        <label class="label" for="panemoveable">
          Pane Movable
          <input
            id="panemoveable"
            v-model="panOnDrag"
            type="checkbox"
            class="vue-flow__panemoveable"
          />
        </label>
      </div>
      <div>
        <label class="label" for="edgecolor">
          Edge Color
          <input id="edgecolor" v-model="edge_color" type="color" />
        </label>
      </div>
      <div>
        <label class="label" for="edgeanimated">
          Edge Animated
          <input
            id="edgeanimated"
            v-model="edge_animated"
            type="checkbox"
            class="vue-flow__draggable"
          />
        </label>
      </div>
    </div>
  </Panel>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Panel, useVueFlow } from '@vue-flow/core'
import Icon from './Icon.vue'
const { nodesDraggable, zoomOnScroll, panOnDrag } = useVueFlow()
const emit = defineEmits(['add_node', 'update_edge_style', 'export_graph'])
const style_config = ref(false)
const node_config = ref(false)
const node_id = ref('')
const edge_animated = ref(false)
const edge_color = ref('#53d5fd')

function add_node() {
  node_config.value = false
  if (node_id.value) {
    emit('add_node', node_id.value)
  }
  node_id.value = ''
}

watch(edge_animated, (newVal) => {
  emit('update_edge_style', 'animated', newVal)
})

watch(edge_color, (newVal) => {
  console.log(newVal)
  emit('update_edge_style', 'color', newVal)
})
</script>

<style lang="less">
.vue-flow__panel {
  background-color: #2d3748;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 0 10px #00000080;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
}

.vue-flow__panel .label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
  cursor: pointer;
}

.vue-flow__panel .label input {
  cursor: pointer;
}

.control-main-area {
  display: flex;
}

.control-node-area {
  position: relative;
  width: 90%;
  display: flex;
  background-color: #2d3748;
  border-radius: 5px;

  input {
    width: 70px;
    height: 20px;
    margin: 5px;
    padding-left: 5px;
    border-radius: 5px;
    border: none;
  }

  button {
    width: 35px;
    height: 20px;
    margin: 5px;
    border: none;
    border-radius: 5px;
    font-size: 14px;
    font-weight: 600;
    background-color: azure;
    color: #2d3748;
    cursor: pointer;
    &:hover {
      background-color: #2563eb;
    }
  }
}

.control-setting-area {
  margin: 5px;
}
</style>
