const { app, ipcMain, BrowserWindow } = require('electron');
const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs');

let mainWindow;
let udpWorker;

function createUdpWorker() {
  // Point to the worker file
  // Note: path resolution depends on your build structure (see Step 4 below)
  const workerPath = path.join(__dirname, 'workers/udpWorker.js');
  
  udpWorker = new Worker(workerPath);

  // Handle messages coming FROM the worker
  udpWorker.on('message', (msg) => {
    if (msg.type === 'UDP_MESSAGE') {
      // Forward the UDP data to the React Renderer
      // console.log('UDP Message:', msg.payload);
      if (mainWindow) {
        mainWindow.webContents.send('udp-data-received', msg.payload);
      }
    } else if (msg.type === 'STATUS') {
      console.log('Worker Status:', msg.status);
    }
  });

  udpWorker.on('error', (err) => console.error('Worker thread error:', err));
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      // Connect the preload script
      preload: path.join(__dirname, '../preload/preload.js'),
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    // DEV MODE: load from Vite dev server (HMR, hot reload)
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // PROD MODE: load from built files in dist folder
    const indexPath = path.join(__dirname, '../../dist', 'index.html');

    if (!fs.existsSync(indexPath)) {
      console.error('dist/index.html not found. Please run: npm run electron:build');
      app.quit();
      return;
    }

    mainWindow.loadFile(indexPath);
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  createUdpWorker();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler: React wants to send a UDP message
ipcMain.handle('send-udp', (event, { message, address, port }) => {
  // Pass the command to the Worker Thread
  udpWorker.postMessage({ 
    type: 'SEND_UDP', 
    payload: { message, address, port } 
  });
});