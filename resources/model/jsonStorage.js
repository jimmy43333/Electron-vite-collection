import storage from 'electron-json-storage'

export async function getElectronJsonStorage(key) {
  return new Promise((resolve, reject) => {
    const p = storage.getDataPath()
    console.log(`INIT DATA PATH: ${p}`)
    let temp = storage.getSync(key)
    if (Object.keys(temp).length === 0) {
      let data = {}
      data['IntValue'] = 0
      data['StringValue'] = 'Default String'
      data['BooleanValue'] = true
      data['ArrayValue'] = [1, 2, 3]
      resolve(data)
    } else {
      resolve(temp)
    }
  })
}

export async function setElectronJsonStorage(key, data) {
  return new Promise((resolve, reject) => {
    storage.set(key, data, (error) => {
      if (error) {
        console.error('Error saving data:', error)
        reject({ success: false, error: error.message })
      } else {
        console.log('Data saved successfully')
        resolve({ success: true })
      }
    })
  })
}

export async function removeElectronJsonStorage(key) {
  return new Promise((resolve, reject) => {
    storage.remove(key, (error) => {
      if (error) {
        console.error('Error removing data:', error)
        reject({ success: false, error: error.message })
      } else {
        console.log('Data removed successfully')
        resolve({ success: true })
      }
    })
  })
}
