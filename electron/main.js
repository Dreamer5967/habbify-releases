import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, session, dialog } from 'electron'
Menu.setApplicationMenu(null)
import http from 'http'
import fs from 'fs'
import { exec, spawn, execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import extract from 'extract-zip'
import https from 'https'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow
let trayWindow = null
let tray = null

const getRendererPath = () => path.join(app.getAppPath(), 'dist/renderer/index.html')
const getTrayIconPath = () => path.join(app.getAppPath(), 'dist/renderer/logo.png')

// Set app name for macOS menu bar
app.setName('Habbify')

// Single Instance Lock for Deep Linking
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

// macOS Deep Linking
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

// Register custom protocol 'habbify://'
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('habbify', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('habbify')
}

function handleDeepLink(urlStr) {
  try {
    const url = new URL(urlStr)
    if (url.hostname === 'auth' && mainWindow && !mainWindow.isDestroyed()) {
      const idToken = url.searchParams.get('id_token')
      if (idToken) {
        mainWindow.webContents.send('auth-callback', idToken)
      }
    }
  } catch (e) {
    console.error('Deep link error:', e)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    menuBarVisible: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => { console.log(`[Renderer]: ${message}`); });
    mainWindow.loadURL('http://localhost:5174')
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => { console.log(`[Renderer]: ${message}`); });
    mainWindow.loadFile(getRendererPath())
  }
}

function createTrayWindow() {
  trayWindow = new BrowserWindow({
    width: 350,
    height: 500,
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  })

  trayWindow.on('closed', () => {
    trayWindow = null
  })
  
  // Load the app with a hash route to render the TrayApp component instead of the main app
  if (process.env.NODE_ENV === 'development') {
    trayWindow.loadURL('http://localhost:5174/#/tray')
  } else {
    trayWindow.loadFile(getRendererPath(), { hash: '/tray' })
  }

  // Hide the window when it loses focus
  trayWindow.on('blur', () => {
    if (trayWindow && !trayWindow.isDestroyed() && !trayWindow.webContents.isDevToolsOpened()) {
      trayWindow.hide()
    }
  })
}

const toggleTrayWindow = () => {
  if (!trayWindow || trayWindow.isDestroyed()) {
    createTrayWindow()
  }
  if (trayWindow.isVisible()) {
    trayWindow.hide()
  } else {
    const position = getWindowPosition()
    trayWindow.setPosition(position.x, position.y, false)
    trayWindow.show()
    trayWindow.focus()
  }
}

const getWindowPosition = () => {
  if (!trayWindow || trayWindow.isDestroyed() || !tray || tray.isDestroyed()) {
    return { x: 0, y: 0 }
  }
  const windowBounds = trayWindow.getBounds()
  const trayBounds = tray.getBounds()
  
  let x, y
  // Center window horizontally below the tray icon
  x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
  
  // Position window vertically depending on OS
  if (process.platform === 'darwin') {
    y = Math.round(trayBounds.y + trayBounds.height + 4)
  } else {
    // Windows taskbar is usually at the bottom
    y = Math.round(trayBounds.y - windowBounds.height - 4)
  }
  
  return { x, y }
}

app.whenReady().then(() => {
  if (!gotTheLock) return
  
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    } else {
      createWindow()
    }
    const deepLinkUrl = commandLine.find(arg => arg.startsWith('habbify://'))
    if (deepLinkUrl) handleDeepLink(deepLinkUrl)
  })

  createWindow()

  // Intercept requests to Firebase/Google APIs and spoof the Origin header
  // This bypasses API key referrer restrictions when running from file:// in Electron
  const filter = {
    urls: [
      'https://*.firebaseio.com/*',
      'https://*.googleapis.com/*',
      'https://*.google.com/*',
      'https://*.firebase.com/*',
      'https://*.firebaseapp.com/*',
      'https://*.cloudfunctions.net/*'
    ]
  }
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    details.requestHeaders['Origin'] = 'http://localhost:13377'
    details.requestHeaders['Referer'] = 'http://localhost:13377/'
    callback({ requestHeaders: details.requestHeaders })
  })

  // Initialize System Tray
  const trayIconPath = getTrayIconPath()
  const trayIcon = nativeImage.createFromPath(trayIconPath).resize({ width: 16, height: 16 })
  tray = new Tray(trayIcon)
 
  if (process.platform === 'darwin') {
    tray.setTitle('🚀')
  }
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Habbify', click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
        } else {
          createWindow()
        }
    }},
    { type: 'separator' },
    { label: 'No active habits today', enabled: false },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ])
  tray.setToolTip('Habbify')
  
  // Create the tray window
  createTrayWindow()
  
  // Right click opens standard menu, left click opens the custom UI
  tray.on('right-click', () => {
    tray.popUpContextMenu(contextMenu)
  })
  
  tray.on('click', (event) => {
    toggleTrayWindow()
  })

  app.on('activate', function () {
    if (!mainWindow || mainWindow.isDestroyed()) createWindow()
  })

  // Custom Auto-Updater for Unsigned macOS App
  const checkForUpdates = () => {
    const currentVersion = app.getVersion()
    const options = {
      hostname: 'api.github.com',
      path: '/repos/Dreamer5967/habbify-releases/releases/latest',
      headers: { 'User-Agent': 'Habbify-App' }
    }

    https.get(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const release = JSON.parse(data)
          const latestVersion = release.tag_name.replace('v', '')
          
          if (latestVersion !== currentVersion && release.assets) {
            const zipAsset = release.assets.find(a => a.name.endsWith('.zip'))
            if (zipAsset) {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('update-ready', latestVersion)
              }
              ipcMain.removeAllListeners('install-update')
              ipcMain.on('install-update', () => {
                installUpdate(zipAsset.browser_download_url)
              })
            }
          }
        } catch (e) {
          console.error('Update check failed:', e)
        }
      })
    }).on('error', (e) => console.error('Update check error:', e))
  }

  const installUpdate = (zipUrl) => {
    console.log('Starting custom update installation...')
    const zipPath = path.join(app.getPath('temp'), 'habbify-update.zip')
    const extractPath = path.join(app.getPath('temp'), 'HabbifyUpdate')
    
    exec(`curl -L -o "${zipPath}" "${zipUrl}"`, async (error) => {
      if (error) {
        console.error('Download failed', error)
        return
      }
      
      console.log('Download complete. Extracting...')
      try {
        if (fs.existsSync(extractPath)) {
          fs.rmSync(extractPath, { recursive: true, force: true })
        }
        
        await extract(zipPath, { dir: extractPath })
        console.log('Extraction complete.')
        
        const findApp = (dir) => {
          const files = fs.readdirSync(dir)
          for (const file of files) {
            const fullPath = path.join(dir, file)
            if (file.endsWith('.app')) return fullPath
            if (fs.statSync(fullPath).isDirectory()) {
              const res = findApp(fullPath)
              if (res) return res
            }
          }
          return null
        }
        
        const newAppPath = findApp(extractPath)
        if (!newAppPath) {
          console.error('Could not find .app in extracted zip')
          return
        }
        
        const currentAppPath = app.getPath('exe').split('.app')[0] + '.app'
        
        const scriptPath = path.join(app.getPath('temp'), 'update-habbify.sh')
        const scriptContent = `#!/bin/bash
sleep 2
rm -rf "${currentAppPath}"
mv "${newAppPath}" "${currentAppPath}"
rm -rf "${extractPath}" "${zipPath}"
open "${currentAppPath}"
`
        fs.writeFileSync(scriptPath, scriptContent)
        fs.chmodSync(scriptPath, '755')
        
        console.log('Running swap script and quitting...')
        const child = spawn(scriptPath, [], {
          detached: true,
          stdio: 'ignore'
        })
        child.unref()
        app.quit()
        
      } catch (err) {
        console.error('Extraction failed', err)
      }
    })
  }

  checkForUpdates()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Update Tray Habits (We keep this for fallback/native menu if needed, but mostly UI will use React now)
ipcMain.on('update-tray-habits', (event, habits) => {
  if (!tray) return
  if (trayWindow && !trayWindow.isDestroyed()) {
    trayWindow.webContents.send('sync-habits', habits)
  }
})

// Local Auth Server Logic
let authServer = null
let pendingAuthResolve = null

ipcMain.handle('start-auth-server', (event, config) => {
  return new Promise((resolve) => {
    if (authServer) {
      resolve(authServer.address().port)
      return
    }
    authServer = http.createServer((req, res) => {
      if (req.url === '/auth.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Logging in...</title>
          </head>
          <body style="font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; color: white; text-align: center;">
            <div>
              <h2 style="margin-bottom: 24px;">Sign in to Habbify</h2>
              <button id="loginBtn" style="background-color: white; color: #0f172a; border: none; border-radius: 8px; padding: 12px 24px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 12px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <p id="errorText" style="color: #ef4444; margin-top: 16px; font-size: 14px; max-width: 300px;"></p>
            </div>
            
            <script type="module">
              import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
              import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
              
              const firebaseConfig = ${JSON.stringify(config)};
              const app = initializeApp(firebaseConfig);
              const auth = getAuth(app);
              const provider = new GoogleAuthProvider();
              
              const btn = document.getElementById('loginBtn');
              btn.addEventListener('click', () => {
                btn.innerText = "Authenticating...";
                btn.style.opacity = "0.7";
                
                signInWithPopup(auth, provider).then(async (result) => {
                  const credential = GoogleAuthProvider.credentialFromResult(result);
                  const idToken = credential.idToken;
                  document.body.innerHTML = "<h2 style='color: #22c55e;'>✅ Success! Returning to Habbify...</h2><p style='color: #94a3b8;'>You can close this tab.</p>";
                  
                  // Send token back to Electron via localhost callback
                  fetch("http://127.0.0.1:13377/callback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken: idToken })
                  }).then(() => {
                    setTimeout(() => window.close(), 1500);
                  });
                }).catch(e => {
                  btn.innerText = "Continue with Google";
                  btn.style.opacity = "1";
                  
                  if (e.message.includes('requests-from-referer')) {
                    document.getElementById('errorText').innerHTML = \`
                      <b>API Key Restriction Blocked Login!</b><br><br>
                      Your Google Cloud API Key is restricting which domains can use it. To fix this:<br>
                      1. Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color: #60a5fa;">Google Cloud Console</a><br>
                      2. Select your Firebase project.<br>
                      3. Edit your <b>Browser API key</b>.<br>
                      4. Under "Website restrictions", add: <code>http://localhost:13377/*</code><br>
                      5. Save and try again in 5 minutes.
                    \`;
                  } else {
                    document.getElementById('errorText').innerText = e.message;
                  }
                });
              });
            </script>
          </body>
          </html>
        `)
      } else if (req.url === '/callback' && req.method === 'POST') {
        // Receive the token directly from the browser page
        let body = ''
        req.on('data', chunk => body += chunk)
        req.on('end', () => {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          })
          res.end(JSON.stringify({ ok: true }))
          
          try {
            const data = JSON.parse(body)
            if (data.idToken && mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('auth-callback', data.idToken)
              mainWindow.focus()
            }
          } catch (e) {
            console.error('Auth callback parse error:', e)
          }
        })
      } else if (req.method === 'OPTIONS') {
        // Handle CORS preflight
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        })
        res.end()
      } else {
        res.writeHead(404)
        res.end('Not found')
      }
    })
    authServer.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        resolve(13377) // Already running
      }
    })
    authServer.listen(13377, '127.0.0.1', () => {
      resolve(13377)
    })
  })
})

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url)
})
