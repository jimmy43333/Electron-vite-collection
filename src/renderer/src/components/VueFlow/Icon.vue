<template>
  <div class="control-icon">
    <svg v-if="id == 'add_node'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path
        fill="#09244B"
        d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m0 5a1 1 0 0 0-.993.883L11 8v3H8a1 1 0 0 0-.117 1.993L8 13h3v3a1 1 0 0 0 1.993.117L13 16v-3h3a1 1 0 0 0 .117-1.993L16 11h-3V8a1 1 0 0 0-1-1"
      ></path>
    </svg>
    <svg v-if="id == 'snapshot'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path
        fill="#09244B"
        d="M14.793 3a1.5 1.5 0 0 1 .95.34l.11.1L17.415 5H20a2 2 0 0 1 1.995 1.85L22 7v12a2 2 0 0 1-1.85 1.995L20 21H4a2 2 0 0 1-1.995-1.85L2 19V7a2 2 0 0 1 1.85-1.995L4 5h2.586l1.56-1.56a1.5 1.5 0 0 1 .913-.433L9.207 3zM12 7.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10m0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6"
      ></path>
    </svg>
    <svg v-if="id == 'style_config'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path
        fill="#09244B"
        d="M18.5 4a1.5 1.5 0 0 0-3 0v.5H4a1.5 1.5 0 1 0 0 3h11.5V8a1.5 1.5 0 0 0 3 0v-.5H20a1.5 1.5 0 0 0 0-3h-1.5zM4 10.5a1.5 1.5 0 0 0 0 3h1.5v.5a1.5 1.5 0 0 0 3 0v-.5H20a1.5 1.5 0 0 0 0-3H8.5V10a1.5 1.5 0 1 0-3 0v.5zM2.5 18A1.5 1.5 0 0 1 4 16.5h11.5V16a1.5 1.5 0 0 1 3 0v.5H20a1.5 1.5 0 0 1 0 3h-1.5v.5a1.5 1.5 0 0 1-3 0v-.5H4A1.5 1.5 0 0 1 2.5 18"
      ></path>
    </svg>
    <svg v-if="id == 'export'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path
        fill="#09244B"
        d="M14 2v5.5A1.5 1.5 0 0 0 15.5 9H21v7a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zM8 8H6v12h9v-2h-5a2 2 0 0 1-2-2zm8-5.957a2 2 0 0 1 1 .543L20.414 6a2 2 0 0 1 .543 1H16z"
      ></path>
    </svg>
  </div>
</template>

<script setup>
const props = defineProps(['id'])
</script>

<style>
.control-icon {
  background-color: azure;
  display: flex;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  margin: 3px;
}

.control-icon:hover {
  background-color: #2563eb;
  transition: background-color 0.2s;
}
</style>
