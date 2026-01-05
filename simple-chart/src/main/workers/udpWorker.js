// src/main/workers/udpWorker.js
const { parentPort } = require('worker_threads');
const dgram = require('dgram');

const socket = dgram.createSocket('udp4');
const PORT = 41234; // Example Port

// Heartbeat configuration
const HEARTBEAT_TARGET_ADDRESS = '127.0.0.1';
const HEARTBEAT_TARGET_PORT = 41235;
const HEARTBEAT_INTERVAL = 1000; // 1 second in milliseconds

let heartbeatInterval = null;

// Function to send heartbeat message
function sendHeartbeat() {
  const heartbeatMessage = JSON.stringify({
    type: 'HEARTBEAT_MESSAGES',
    timestamp: Date.now()
  });
  
  const message = Buffer.from(heartbeatMessage);
  
  socket.send(message, HEARTBEAT_TARGET_PORT, HEARTBEAT_TARGET_ADDRESS, (err) => {
    if (err) {
      console.error('UDP Worker: Error sending heartbeat:', err.message);
    }
  });
}

// 1. Listen for incoming UDP messages
socket.on('message', (msg, rinfo) => {
  try {
    const msgString = msg.toString();
    const parsedMsg = JSON.parse(msgString);
    
    // Check if this is a HEARTBEAT_MESSAGES
    if (parsedMsg.type === 'HEARTBEAT_MESSAGES') {
      // Handle heartbeat message separately
      const heartbeatData = {
        type: 'HEARTBEAT',
        timestamp: parsedMsg.timestamp || Date.now(),
        sender: `${rinfo.address}:${rinfo.port}`,
        receivedAt: Date.now()
      };
      
      // Send heartbeat to Main Process
      parentPort.postMessage({ type: 'HEARTBEAT_MESSAGE', payload: heartbeatData });
      console.log(`UDP Worker: Received heartbeat at ${new Date(heartbeatData.timestamp).toLocaleTimeString()}`);
      return;
    }
    
    // For other messages, send as regular UDP_MESSAGE
    const data = {
      msg: msgString,
      sender: `${rinfo.address}:${rinfo.port}`,
      timestamp: Date.now()
    };

    // Send data back to the Main Process
    parentPort.postMessage({ type: 'UDP_MESSAGE', payload: data });
  } catch (error) {
    // If message is not JSON or parsing fails, treat as regular message
    const data = {
      msg: msg.toString(),
      sender: `${rinfo.address}:${rinfo.port}`,
      timestamp: Date.now()
    };
    parentPort.postMessage({ type: 'UDP_MESSAGE', payload: data });
  }
});

socket.on('listening', () => {
  const address = socket.address();
  console.log(`UDP Worker: Listening on ${address.address}:${address.port}`);
  
  // Notify Main Process that we are ready
  parentPort.postMessage({ type: 'STATUS', status: 'LISTENING' });
  
  // Start heartbeat interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  console.log(`UDP Worker: Heartbeat started (every ${HEARTBEAT_INTERVAL}ms)`);
});

socket.on('error', (err) => {
  console.error(`UDP Worker Error:\n${err.stack}`);
  parentPort.postMessage({ type: 'ERROR', error: err.message });
  
  // Clean up heartbeat interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  socket.close();
});

socket.on('close', () => {
  // Clean up heartbeat interval when socket closes
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('UDP Worker: Heartbeat stopped (socket closed)');
  }
});

// 2. Listen for commands from the Main Process (e.g., to send data)
parentPort.on('message', (command) => {
  if (command.type === 'SEND_UDP') {
    const message = Buffer.from(command.payload.message);
    const { port, address } = command.payload;

    socket.send(message, port, address, (err) => {
      if (err) {
        parentPort.postMessage({ type: 'ERROR', error: err.message });
      } else {
        console.log('UDP Worker: Message sent');
      }
    });
  }
});

// Bind the socket
socket.bind(PORT);