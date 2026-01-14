const { contextBridge, ipcRenderer } = require('electron');

// Centralized UDP data listener system
// Only ONE IPC listener that routes data to subscribers based on data.type
const udpSubscribers = new Map(); // Map<type, Set<callback>>

// Single IPC listener for all UDP data
const handleUdpData = (_event, udpPayload) => {
  try {
    // Parse the UDP payload to extract the type
    const { msg } = udpPayload;
    let parsedData;
    
    try {
      parsedData = JSON.parse(msg);
    } catch (e) {
      // If msg is not JSON, try to use the payload directly
      parsedData = udpPayload;
    }

    // Extract the type from parsed data
    const dataType = parsedData?.type || 'UNKNOWN';
    
    // Route to subscribers for this specific type
    const typeSubscribers = udpSubscribers.get(dataType);
    if (typeSubscribers) {
      typeSubscribers.forEach(callback => {
        try {
          callback(udpPayload);
        } catch (error) {
          console.error(`[UDP Router] Error in subscriber for type ${dataType}:`, error);
        }
      });
    }

    // Also route to 'ALL' subscribers (for components that need all data regardless of type)
    const allSubscribers = udpSubscribers.get('ALL');
    if (allSubscribers) {
      allSubscribers.forEach(callback => {
        try {
          callback(udpPayload);
        } catch (error) {
          console.error('[UDP Router] Error in ALL subscriber:', error);
        }
      });
    }
  } catch (error) {
    console.error('[UDP Router] Error processing UDP data:', error);
  }
};

// Register the single IPC listener
ipcRenderer.on('udp-data-received', handleUdpData);

contextBridge.exposeInMainWorld('electronAPI', {
  // Subscribe to UDP data for a specific type
  // type: string - the data.type to listen for, or 'ALL' to receive all data
  // callback: function - the callback function to call when data arrives
  // Returns: unsubscribe function
  subscribeUdpData: (type, callback) => {
    if (!type || typeof callback !== 'function') {
      console.warn('[UDP Router] Invalid subscription: type and callback required');
      return () => {};
    }

    if (!udpSubscribers.has(type)) {
      udpSubscribers.set(type, new Set());
    }
    
    udpSubscribers.get(type).add(callback);
    
    // Return unsubscribe function
    return () => {
      const typeSubscribers = udpSubscribers.get(type);
      if (typeSubscribers) {
        typeSubscribers.delete(callback);
        if (typeSubscribers.size === 0) {
          udpSubscribers.delete(type);
        }
      }
    };
  },
  
  // Legacy support: onUdpData (subscribes to ALL types)
  // Deprecated: Use subscribeUdpData('ALL', callback) instead
  onUdpData: (callback) => {
    console.warn('[UDP Router] onUdpData is deprecated. Use subscribeUdpData("ALL", callback) instead.');
    // Call subscribeUdpData directly (defined above in the same object)
    if (!udpSubscribers.has('ALL')) {
      udpSubscribers.set('ALL', new Set());
    }
    udpSubscribers.get('ALL').add(callback);
    return () => {
      const allSubscribers = udpSubscribers.get('ALL');
      if (allSubscribers) {
        allSubscribers.delete(callback);
        if (allSubscribers.size === 0) {
          udpSubscribers.delete('ALL');
        }
      }
    };
  },
  
  // Listen for heartbeat messages
  onHeartbeat: (callback) => ipcRenderer.on('heartbeat-received', (_event, value) => callback(value)),
  
  // Send data out via UDP
  sendUdp: (data) => ipcRenderer.invoke('send-udp', data),
  
  // Clean up listener (optional but good practice)
  removeUdpListener: () => {
    udpSubscribers.clear();
    ipcRenderer.removeAllListeners('udp-data-received');
    // Re-register the single listener
    ipcRenderer.on('udp-data-received', handleUdpData);
  },
  removeHeartbeatListener: () => ipcRenderer.removeAllListeners('heartbeat-received')

});