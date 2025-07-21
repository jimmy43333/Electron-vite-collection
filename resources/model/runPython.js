const { spawn } = require('child_process')

/**
 * Executes a Python script.
 * @param {string} scriptPath - Path to the Python script.
 * @param {string[]} [args=[]] - Arguments to pass to the script.
 * @returns {Promise<string>} - Resolves with stdout, rejects with stderr.
 */

export function runPython(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [scriptPath, ...args])
    let stdout = ''
    let stderr = ''

    py.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    py.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    py.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim())
      } else {
        reject(new Error(stderr.trim() || `Python process exited with code ${code}`))
      }
    })
  })
}

export function runPythonUpdating(event, scriptPath, args = []) {
  const py = spawn('python3', [scriptPath, ...args])
  py.stdout.on('data', (data) => {
    console.log('Python Output:', data.toString().trim())
    event.sender.send('python-progress', data.toString().trim())
  })

  py.stderr.on('data', (data) => {
    console.error('Python Error:', data.toString().trim())
    event.sender.send('python-progress', data.toString().trim())
  })

  py.on('close', (code) => {
    if (code === 0) {
      event.sender.send('python-done', code)
      return true
    } else {
      throw new Error(`Python process exited with code ${code}`)
    }
  })
}
