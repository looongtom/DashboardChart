// src/main/workers/udpWorker.js
const { parentPort } = require('worker_threads');
const dgram = require('dgram');

const socket = dgram.createSocket('udp4');
const PORT = 41234; // Example Port

// 1. Listen for incoming UDP messages
socket.on('message', (msg, rinfo) => {
  const data = {
    msg: msg.toString(),
    sender: `${rinfo.address}:${rinfo.port}`,
    timestamp: Date.now()
  };

  // Send data back to the Main Process
  parentPort.postMessage({ type: 'UDP_MESSAGE', payload: data });
});

socket.on('listening', () => {
  const address = socket.address();
  console.log(`UDP Worker: Listening on ${address.address}:${address.port}`);
  
  // Notify Main Process that we are ready
  parentPort.postMessage({ type: 'STATUS', status: 'LISTENING' });
});

socket.on('error', (err) => {
  console.error(`UDP Worker Error:\n${err.stack}`);
  parentPort.postMessage({ type: 'ERROR', error: err.message });
  socket.close();
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