const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  startAuthServer: (config) => ipcRenderer.invoke('start-auth-server', config),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  updateTrayHabits: (habits) => ipcRenderer.send('update-tray-habits', habits),
  onTrayCheckIn: (callback) => {
    ipcRenderer.on('tray-check-in', (_event, habitId) => callback(habitId))
  },
  onAuthCallback: (callback) => {
    ipcRenderer.on('auth-callback', (_event, token) => callback(token))
  },
  onUpdateReady: (callback) => {
    ipcRenderer.on('update-ready', (_event, version) => callback(version))
  },
  installUpdate: () => ipcRenderer.send('install-update')
})
