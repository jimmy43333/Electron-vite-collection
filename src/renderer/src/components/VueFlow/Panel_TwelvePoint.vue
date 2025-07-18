<template>
  <div class="twelve-flow-container">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :fit-view="true"
      :zoom-on-scroll="true"
      :pan-on-scroll="false"
      :pan-on-drag="true"
      @edge-double-click="onEdgeClick"
      @node-double-click="onNodeClick"
      @node-drag-stop="onNodeDragStop"
    >
      <ControlPanelNode
        @add_node="onAdd_node"
        @update_edge_style="onUpdate_edge_style"
        @export_graph="onExport_graph"
      />
    </VueFlow>
  </div>
</template>

<script setup>
import { ref, markRaw } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import CustomFourHandleNode from './CustomTwelveHandleNode.vue'
import ControlPanelNode from './ControlPanelNode.vue'
const { onConnect } = useVueFlow()

const nodeTypes = {
  custom: markRaw(CustomFourHandleNode)
}
const nodes = ref([
  // node type: input/output/default
  {
    id: 'OP3.4',
    type: 'custom',
    position: { x: 300, y: 100 },
    data: { label: 'OP3.4' }
  },
  {
    id: 'OP3.2',
    type: 'custom',
    position: { x: 100, y: 100 },
    data: { label: 'OP3.2' }
  },
  {
    id: 'OP3.1',
    type: 'custom',
    position: { x: 200, y: 180 },
    data: { label: 'OP3.1' }
  },
  {
    id: 'OP2.1',
    type: 'custom',
    position: { x: 300, y: 300 },
    data: { label: 'OP2.1' }
  },
  {
    id: 'OP2.3',
    type: 'custom',
    position: { x: 100, y: 300 },
    data: { label: 'OP2.3' }
  },
  {
    id: 'OP1.2',
    type: 'custom',
    position: { x: 375, y: 220 },
    data: { label: 'OP1.2' }
  }
])
const edges = ref([])
const edge_style = ref({
  color: '#53d5fd',
  width: 4,
  animated: false
})

function onEdgeClick(event) {
  // console.log('onEdgeClick', edge.edge.id)
  edges.value = edges.value.filter((e) => e.id !== event.edge.id)
}

function onNodeClick(event) {
  // delete all edges
  edges.value = edges.value.filter((e) => e.source !== event.node.id)
  edges.value = edges.value.filter((e) => e.target !== event.node.id)
  // delete node
  const index = nodes.value.findIndex((n) => n.id === event.node.id)
  if (index !== -1) {
    nodes.value.splice(index, 1) // modifies in-place
  }
}

function onNodeDragStop({ node }) {
  const updated = nodes.value.find((n) => n.id === node.id)
  if (updated) {
    updated.position = { ...node.position }
  }
}

onConnect((params) => {
  let obj = {
    ...params,
    id: `e${params.source}-${params.sourceHandle}>${params.target}-${params.targetHandle}`,
    style: { stroke: edge_style.value.color, strokeWidth: edge_style.value.width },
    markerEnd: {
      type: 'arrowclosed',
      width: 8,
      height: 8,
      color: edge_style.value.color
    },
    animated: edge_style.value.animated
  }
  //   addEdges()
  edges.value.push(obj)
})

function onAdd_node(node_id) {
  let temp = {
    id: node_id,
    type: 'custom',
    position: { x: 600, y: 300 },
    data: { label: node_id }
  }
  nodes.value.push(temp)
}

function onUpdate_edge_style(key, value) {
  edge_style.value[key] = value
}

function getAllReachable(startId, visited = new Set()) {
  const results = new Set()

  function dfs(current) {
    for (const neighbor of graph[current] || []) {
      if (!results.has(neighbor)) {
        results.add(neighbor)
        dfs(neighbor)
      }
    }
  }

  dfs(startId)
  return Array.from(results)
}

const graph = {}

function onExport_graph() {
  let result = {}
  for (const node of nodes.value) {
    graph[node.id] = []
  }

  for (const edge of edges.value) {
    graph[edge.source].push(edge.target)
  }

  for (const node of nodes.value) {
    result[node.id] = getAllReachable(node.id)
  }
  console.log(result)
}
</script>
<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.twelve-flow-container {
  width: 100%;
  height: 100%;
  background-color: rgb(36, 36, 106);
  padding: 10px;
}

.vue-flow__edge-path {
  stroke: #ff5722; /* edge color */
  stroke-width: 2px; /* edge thickness */
  /* stroke-dasharray: 6; /* dashed line, remove for solid */
}
</style>
