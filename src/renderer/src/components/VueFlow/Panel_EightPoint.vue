<template>
  <div class="vue-flow-container">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :fit-view="true"
      :zoom-on-scroll="true"
      :pan-on-scroll="true"
      :pan-on-drag="true"
      @edge-click="onEdgeClick"
    />
  </div>
</template>

<script setup>
import { ref, markRaw } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import CustomFourHandleNode from './CustomEightHandleNode.vue'
const { onConnect } = useVueFlow()

function onEdgeClick(edge) {
  console.log('onEdgeClick', edge.edge.id)
  edges.value = edges.value.filter((e) => e.id !== edge.edge.id)
}

onConnect((params) => {
  let obj = {
    ...params,
    id: `e${params.source}-${params.sourceHandle}>${params.target}-${params.targetHandle}`,
    style: { stroke: '#ff5722', strokeWidth: 2 },
    markerEnd: {
      type: 'arrowclosed',
      width: 12,
      height: 12,
      color: '#ff5722'
    }
  }
  //   addEdges()
  edges.value.push(obj)
})

const nodeTypes = {
  custom: markRaw(CustomFourHandleNode)
}

const nodes = ref([
  // node type: input/output/default
  {
    id: 'cus1',
    type: 'custom',
    position: { x: 10, y: 10 },
    data: { label: 'Step A' }
  },
  {
    id: 'cus2',
    type: 'custom',
    position: { x: 80, y: 130 },
    data: { label: 'Step B' }
  },
  {
    id: 'cus3',
    type: 'custom',
    position: { x: 300, y: 50 },
    data: { label: 'Step C' }
  }
])

// these are our edges
const edges = ref([
  {
    id: 'eC1->C2',
    type: 'default',
    source: 'cus1',
    target: 'cus2',
    sourceHandle: 'down-left-S',
    targetHandle: 'top-left-T',
    animated: true,
    style: { stroke: '#ff5722', strokeWidth: 2 },
    markerEnd: {
      type: 'arrowclosed', // this is the default marker type
      width: 10, // width of the arrowhead
      height: 10, // height of the arrowhead
      color: '#ff5722' // color of the arrowhead
    }
  },
  {
    id: 'eC2->C1',
    type: 'default',
    source: 'cus2',
    target: 'cus1',
    sourceHandle: 'top-right-S',
    targetHandle: 'down-right-T',
    animated: true,
    style: { stroke: '#ff5722', strokeWidth: 2 }
  }
])
</script>
<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.vue-flow-container {
  width: 100%;
  height: 100%;
  background-color: #f4a0053c;
}
</style>
