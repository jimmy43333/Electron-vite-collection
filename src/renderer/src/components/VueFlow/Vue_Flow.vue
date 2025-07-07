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
import CustomFourHandleNode from './CustomFourHandleNode.vue'
const { onConnect } = useVueFlow()

function onEdgeClick(edge) {
  console.log('onEdgeClick', edge.edge.id)
  edges.value = edges.value.filter((e) => e.id !== edge.edge.id)
}

onConnect((params) => {
  let obj = {
    ...params,
    id: `e${params.source}-${params.sourceHandle}>${params.target}-${params.targetHandle}`,
    style: { stroke: '#4caf50', strokeWidth: 2 },
    markerEnd: {
      type: 'arrowclosed',
      width: 12,
      height: 12,
      color: '#4caf50'
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
    position: { x: 500, y: 50 },
    data: { label: 'OP3.2' }
  },
  {
    id: 'cus2',
    type: 'custom',
    position: { x: 500, y: 200 },
    data: { label: 'OP3.1' }
  },
  {
    id: 'cus3',
    type: 'custom',
    position: { x: 400, y: 150 },
    data: { label: 'OP2.1' }
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
    markerEnd: {
      type: 'arrowclosed', // this is the default marker type
      width: 10, // width of the arrowhead
      height: 10, // height of the arrowhead
      color: '#ff5722' // color of the arrowhead
    }
  }
])
</script>
<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';

.vue-flow-container {
  width: 100%;
  height: 50%;
  background-color: antiquewhite;
}

/* Change edge color, thickness, and style */
.vue-flow__edge-path {
  stroke: #ff5722; /* edge color */
  stroke-width: 2px; /* edge thickness */
  /* stroke-dasharray: 6; /* dashed line, remove for solid */
}
</style>
