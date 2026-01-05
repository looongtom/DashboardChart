const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Listen for incoming UDP data
  onUdpData: (callback) => ipcRenderer.on('udp-data-received', (_event, value) => callback(value)),
  
  // Listen for heartbeat messages
  onHeartbeat: (callback) => ipcRenderer.on('heartbeat-received', (_event, value) => callback(value)),
  
  // Send data out via UDP
  sendUdp: (data) => ipcRenderer.invoke('send-udp', data),
  
  // Clean up listener (optional but good practice)
  removeUdpListener: () => ipcRenderer.removeAllListeners('udp-data-received'),
  removeHeartbeatListener: () => ipcRenderer.removeAllListeners('heartbeat-received')

});