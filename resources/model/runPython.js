import { ipcMain } from 'electron'
import path from 'path'
const { spawn, spawnSync, exec } = require('child_process')
const util = require('util')
const execAsync = util.promisify(exec)
/**
 * Executes a Python script.
 * @param {string} scriptPath - Path to the Python script.
 * @param {string[]} [args=[]] - Arguments to pass to the script.
 * @returns {Promise<string>} - Resolves with stdout, rejects with stderr.
 */

function getPythonScriptPath() {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, `../../resources/model/run_python/`)
  } else {
    // In production, try multiple possible paths
    let resourcesPath

    if (process.resourcesPath) {
      // Standard Electron app bundle
      resourcesPath = process.resourcesPath
    } else if (process.env.APPIMAGE) {
      // AppImage environment
      resourcesPath = path.join(process.env.APPDIR, 'resources')
    } else {
      // Fallback
      resourcesPath = path.join(process.cwd(), 'resources')
    }

    const pythonPath = path.join(resourcesPath, 'model', 'run_python')
    console.log('Production Python path:', pythonPath)
    return pythonPath
  }
}

function runPython(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    try {
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

      py.on('error', (error) => {
        console.error('Python spawn error:', error)
        reject(error)
      })
    } catch (error) {
      console.error('Error in runPython:', error)
      reject(error)
    }
  })
}

function runPythonUpdating(event, scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    try {
      const py = spawn('python3', [scriptPath, ...args])

      py.stdout.on('data', (data) => {
        console.log('Python Output:', data.toString().trim())
        if (event && event.sender && !event.sender.isDestroyed()) {
          event.sender.send('python-progress', data.toString().trim())
        }
      })

      py.stderr.on('data', (data) => {
        console.error('Python Error:', data.toString().trim())
        if (event && event.sender && !event.sender.isDestroyed()) {
          event.sender.send('python-progress', data.toString().trim())
        }
      })

      py.on('close', (code) => {
        if (event && event.sender && !event.sender.isDestroyed()) {
          event.sender.send('python-done', code)
        }
        if (code === 0) {
          resolve(code)
        } else {
          reject(new Error(`Python process exited with code ${code}`))
        }
      })

      py.on('error', (error) => {
        console.error('Python spawn error:', error)
        reject(error)
      })
    } catch (error) {
      console.error('Error in runPythonUpdating:', error)
      reject(error)
    }
  })
}

async function runCommand(script_command, args = [], container = false) {
  try {
    let execute = ''
    if (container) {
      execute = `docker exec -i ${container} sh -c '${script_command} ${args.join(' ')}'`
      console.log(execute)
    } else {
      execute = `${script_command} ${args.join(' ')}`
    }
    const { stdout, stderr } = await execAsync(execute)
    if (stderr) {
      console.error('STDERROR:', stderr.trim())
      throw new Error(stderr.trim())
    }
    return stdout.trim()
  } catch (error) {
    console.error('Command execution error:', error)
    throw error // Re-throw to let caller handle it
  }
}

function runCommandSync(script_command, args = []) {
  try {
    let execute = `${script_command} ${args.join(' ')}`
    const { stdout, stderr } = spawnSync(execute, { shell: true })
    if (stderr && stderr.length > 0) {
      console.error('STDERROR:', stderr.toString().trim())
      throw new Error(stderr.toString().trim())
    }
    return stdout.toString().trim()
  } catch (error) {
    console.error('Sync command error:', error)
    throw error // Re-throw to let caller handle it
  }
}

export default function registerRunPythonHandler() {
  //Run python
  ipcMain.handle('run-python', async (event, script_name) => {
    try {
      console.log(`Running Python script: ${script_name}`)
      const scriptPath = path.join(getPythonScriptPath(), script_name)
      const output = await runPython(scriptPath)
      console.log(`Python script output: ${output}`)
      return output
    } catch (err) {
      console.error('Python error:', err)
      return `Error: ${err.message}` // Return error message to renderer
    }
  })

  ipcMain.on('run-python-stream', async (event, script_name) => {
    try {
      const scriptPath = path.join(getPythonScriptPath(), script_name)
      await runPythonUpdating(event, scriptPath)
    } catch (err) {
      console.error('Python streaming error:', err)
      if (event && event.sender && !event.sender.isDestroyed()) {
        event.sender.send('python-done', -1)
      }
    }
  })

  ipcMain.handle('run-async-command', async (event, script_command, args) => {
    try {
      console.log(`Running command: ${script_command} ${args.join(' ')}`)
      const output = await runCommand(script_command, args)
      console.log(`Command output: ${output}`)
      return output
    } catch (err) {
      console.error('Command error:', err)
      return `Error: ${err.message}` // Return error message to renderer
    }
  })

  ipcMain.handle('run-async-command-in-docker', async (event, script_command, args, container) => {
    try {
      console.log(`Running command in docker: ${script_command} ${args.join(' ')}`)
      const output = await runCommand(script_command, args, container)
      console.log(`Command output: ${output}`)
      return output
    } catch (err) {
      console.error('Command error:', err)
      return `Error: ${err.message}` // Return error message to renderer
    }
  })

  ipcMain.handle('run-sync-command', (event, script_command, args) => {
    try {
      console.log(`Running command: ${script_command} ${args.join(' ')}`)
      const output = runCommandSync(script_command, args)
      console.log(`Command output: ${output}`)
      return output
    } catch (err) {
      console.error('Command error:', err)
      return `Error: ${err.message}` // Return error message to renderer
    }
  })

  ipcMain.handle('run-python-exe', (event, script_name) => {
    return new Promise((resolve, reject) => {
      try {
        let base_path = getPythonScriptPath()
        let scriptPath = ''
        console.log('Base Python script path:', process.platform)
        if (process.platform === 'win32') {
          scriptPath = path.join(base_path, 'win', script_name)
        } else if (process.platform === 'darwin') {
          scriptPath = path.join(base_path, 'mac', script_name)
        } else {
          scriptPath = path.join(base_path, 'linux', script_name)
        }
        console.log('Run executable at:', scriptPath)

        // Check if file exists and set executable permissions if needed
        const fs = require('fs')
        if (!fs.existsSync(scriptPath)) {
          const error = new Error(`Executable not found: ${scriptPath}`)
          console.error('File not found error:', error)
          reject(error)
          return
        }

        // Set executable permissions (Unix-like systems)
        try {
          fs.chmodSync(scriptPath, '755')
        } catch (chmodError) {
          console.warn('Could not set executable permissions:', chmodError.message)
        }

        const child = spawn(scriptPath, {
          stdio: ['ignore', 'pipe', 'pipe']
        })

        child.stdout.on('data', (data) => {
          console.log(data.toString())
        })

        child.stderr.on('data', (data) => {
          console.error('[stderr]', data.toString())
        })

        child.on('close', (code) => {
          if (event && event.sender && !event.sender.isDestroyed()) {
            event.sender.send('deploy-log', `Deploy finished with code ${code}`)
          }
          resolve(code)
        })

        child.on('error', (error) => {
          console.error('Spawn error:', error)
          reject(error)
        })
      } catch (err) {
        console.error('Python exe error:', err)
        reject(err)
      }
    })
  })
}
