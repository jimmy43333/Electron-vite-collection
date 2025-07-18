<template>
  <div class="save-json-content">
    <h2>Electron Json Storage</h2>
    <p>{{ message }}</p>
    <div>
      <button @click="loadData">Load</button>
      <button @click="saveData">Save</button>
      <button @click="removeData">Remove</button>
    </div>
    <table>
      <tbody>
        <tr>
          <td>IntValue</td>
          <td>
            <input v-model.lazy="data.IntValue" type="number" />
          </td>
        </tr>
        <tr>
          <td>StringValue</td>
          <td>
            <input v-model.lazy="data.StringValue" type="text" />
          </td>
        </tr>
        <tr>
          <td>BooleanValue</td>
          <td>
            <label> <input v-model="data.BooleanValue" type="radio" :value="true" /> True </label>
            <label> <input v-model="data.BooleanValue" type="radio" :value="false" /> False </label>
          </td>
        </tr>
        <tr>
          <td>ArrayValue</td>
          <td>
            <span v-for="(item, idx) in data.ArrayValue" :key="idx">
              <label>
                <input v-model="check_box_option.ArrayValue[idx]" type="checkbox" />
                {{ item }}
              </label>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const data = ref({})
const check_box_option = ref({})
const message = ref('Stored under: ~/.config/electron-vite-collection/storage')

async function loadData() {
  try {
    const response = await window.electron.ipcRenderer.sendSync(
      'get_electron_json_storage',
      'DemoJsonStorage'
    )
    data.value = response
    if (Array.isArray(response.ArrayValue)) {
      check_box_option.value.ArrayValue = response.ArrayValue.map(() => true)
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
  // console.log(data.value)
}

async function saveData() {
  try {
    if (Array.isArray(data.value.ArrayValue) && Array.isArray(check_box_option.value.ArrayValue)) {
      data.value.ArrayValue = data.value.ArrayValue.filter(
        (item, idx) => check_box_option.value.ArrayValue[idx]
      )
    }
    let dataToSave = JSON.stringify(data.value)
    await window.electron.ipcRenderer.sendSync(
      'set_electron_json_storage',
      'DemoJsonStorage',
      dataToSave
    )
    alert('Saved!')
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

async function removeData() {
  try {
    await window.electron.ipcRenderer.sendSync('remove_electron_json_storage', 'DemoJsonStorage')
    alert('Removed!')
  } catch (error) {
    console.error('Error removing settings:', error)
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style lang="less">
.save-json-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: left;
  justify-content: left;
  padding: 50px;

  table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 20px;
    background: #7a7a7a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    color: #303030;
    font-weight: 600;

    th,
    td {
      border: 2px solid #e0e0e046;
      padding: 12px 16px;
      font-size: 16px;
    }

    tr:nth-child(even) {
      background: #62b1be;
    }

    input[type='text'],
    input[type='number'] {
      padding: 3px 3px;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
      font-size: 15px;
      background: #fff;
      color: #222;
      outline: none;

      &:focus {
        border: 1px solid #62b1be;
        background: #f0f8ff;
      }
    }

    input[type='radio'],
    input[type='checkbox'] {
      accent-color: #f8f676;
      margin-right: 6px;
      transform: scale(1.1);
    }

    label {
      margin-right: 16px;
      margin-bottom: 4px;
      display: inline-flex;
      align-items: center;
    }
  }
}
</style>
