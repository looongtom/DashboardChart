// src/main/workers/udpWorker.js
const { parentPort } = require('worker_threads');
const dgram = require('dgram');

const socket = dgram.createSocket('udp4');
const PORT = 41234;

// Heartbeat configuration
const HEARTBEAT_TARGET_ADDRESS = '127.0.0.1';
const HEARTBEAT_TARGET_PORT = 41235;
const HEARTBEAT_INTERVAL = 1000; // 1 second in milliseconds
const HEARTBEAT_CHUNK_SIZE = 1024; // Maximum chunk size for packet splitting

let heartbeatInterval = null;
let socketAddress = '127.0.0.1'; // Default, will be updated when socket is bound
let socketPort = PORT; // Default, will be updated when socket is bound

// ============== Packet Class ==============
class Packet {
  constructor(messageId, payload) {
    this.messageId = messageId;
    this.payload = payload;
    this.chunkIndex = 0;
    this.totalChunk = 0;
    this.sourceAddress = null;
    this.sourcePort = 0;
    this.totalPayloadLength = 0;
    this.buffer = null;
  }

  setSourceAddress(address) {
    this.sourceAddress = address;
  }

  setSourcePort(port) {
    this.sourcePort = port;
  }

  setChunkIndex(index) {
    this.chunkIndex = index;
  }

  setTotalChunk(total) {
    this.totalChunk = total;
  }

  setTotalPayloadLength(length) {
    this.totalPayloadLength = length;
  }
}

// ============== CRC32 Implementation ==============
function convertToCrc32(data) {
  const makeCRCTable = () => {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      crcTable[n] = c;
    }
    return crcTable;
  };

  const crcTable = makeCRCTable();
  let crc = 0 ^ (-1);

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
  }

  return (crc ^ (-1)) >>> 0;
}

// ============== Packet Splitting Functions ==============

/**
 * Calculate metadata length for a packet
 * @param {string} sourceAddress - IP address (IPv4 or IPv6)
 * @returns {number} - Metadata length in bytes
 */
function calculateMetadataLength(sourceAddress) {
  // Determine IP version and byte length
  let ipBytesLength;
  if (sourceAddress.includes(':')) {
    // IPv6
    ipBytesLength = 16;
  } else {
    // IPv4
    ipBytesLength = 4;
  }
  
  // Calculate metadata length:
  // 2 (magic) + 8 (messageId) + 4*2 (totalLength + payloadLen) + 
  // 1 (ipVersion) + ipBytes.length + 2 (port) + 4*2 (chunkIndex + totalChunk)
  return 2 + 8 + 4 * 2 + 1 + ipBytesLength + 2 + 4 * 2;
}

/**
 * Split payload into multiple packets
 * @param {Uint8Array|Buffer} payload - The data to split
 * @param {number} chunkSize - Maximum size of each chunk in bytes
 * @param {BigInt|number} messageId - Unique message identifier
 * @param {string} sourceAddress - Source IP address (IPv4 or IPv6)
 * @param {number} sourcePort - Source port number
 * @returns {Packet[]} - Array of packets
 */
function splitPacket(payload, chunkSize, messageId, sourceAddress, sourcePort) {
  const result = [];
  
  // Convert payload to Uint8Array if it's a Buffer
  const payloadArray = payload instanceof Buffer ? new Uint8Array(payload) : payload;
  
  const metadataLength = calculateMetadataLength(sourceAddress);
  const maxPayloadLength = chunkSize - metadataLength - 8; // 8 bytes for checksum
  const payloadLength = payloadArray.length;
  
  // Calculate total number of chunks
  const totalChunk = Math.ceil(payloadLength / maxPayloadLength);
  
  for (let i = 0; i < totalChunk; i++) {
    const start = i * maxPayloadLength;
    const length = Math.min(maxPayloadLength, payloadLength - start);
    
    // Create chunk payload
    const chunkPayload = new Uint8Array(length);
    chunkPayload.set(payloadArray.subarray(start, start + length));
    
    // Create packet
    const packet = new Packet(BigInt(messageId), chunkPayload);
    packet.setChunkIndex(i);
    packet.setTotalChunk(totalChunk);
    packet.setSourceAddress(sourceAddress);
    packet.setSourcePort(sourcePort);
    packet.setTotalPayloadLength(payloadLength);
    
    result.push(packet);
  }
  
  // Sort by chunk index (already in order, but matching Java logic)
  result.sort((a, b) => a.chunkIndex - b.chunkIndex);
  
  return result;
}

/**
 * Encode a packet to bytes for transmission
 * @param {Packet} packet - The packet to encode
 * @returns {Uint8Array} - Encoded packet as bytes
 */
function encodePacketToBytes(packet) {
  const sourceAddress = packet.sourceAddress;
  
  // Determine IP version and convert address to bytes
  let ipVersion;
  let ipBytes;
  
  if (sourceAddress.includes(':')) {
    // IPv6
    ipVersion = 6;
    const parts = sourceAddress.split(':');
    ipBytes = new Uint8Array(16);
    let offset = 0;
    for (const part of parts) {
      const value = parseInt(part || '0', 16);
      ipBytes[offset++] = (value >> 8) & 0xFF;
      ipBytes[offset++] = value & 0xFF;
    }
  } else {
    // IPv4
    ipVersion = 4;
    const parts = sourceAddress.split('.');
    ipBytes = new Uint8Array(parts.map(p => parseInt(p, 10)));
  }
  
  // Calculate checksum for payload
  const checksum = BigInt(convertToCrc32(packet.payload));
  
  // Calculate total buffer size
  const metadataLength = calculateMetadataLength(sourceAddress);
  const totalSize = metadataLength + 8 + packet.payload.length; // +8 for checksum
  
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);
  let offset = 0;
  
  // Write magic (2 bytes)
  view.setInt16(offset, 0xCAFE);
  offset += 2;
  
  // Write messageId (8 bytes)
  view.setBigInt64(offset, BigInt(packet.messageId));
  offset += 8;
  
  // Write totalLength (4 bytes)
  view.setInt32(offset, packet.totalPayloadLength);
  offset += 4;
  
  // Write payloadLen (4 bytes)
  view.setInt32(offset, packet.payload.length);
  offset += 4;
  
  // Write ipVersion (1 byte)
  view.setInt8(offset, ipVersion);
  offset += 1;
  
  // Write IP address bytes
  uint8View.set(ipBytes, offset);
  offset += ipBytes.length;
  
  // Write sourcePort (2 bytes)
  view.setUint16(offset, packet.sourcePort);
  offset += 2;
  
  // Write chunkIndex (4 bytes)
  view.setInt32(offset, packet.chunkIndex);
  offset += 4;
  
  // Write totalChunk (4 bytes)
  view.setInt32(offset, packet.totalChunk);
  offset += 4;
  
  // Write checksum (8 bytes)
  view.setBigInt64(offset, checksum);
  offset += 8;
  
  // Write payload
  uint8View.set(packet.payload, offset);
  
  return uint8View;
}

// Function to send heartbeat message
function sendHeartbeat() {
  const heartbeatMessage = JSON.stringify({
    type: 'HEARTBEAT_MESSAGES',
    timestamp: Date.now()
  });
  
  const payload = Buffer.from(heartbeatMessage);
  const messageId = Date.now();
  const sourceAddress = socketAddress;
  const sourcePort = socketPort;
  
  // Split packet if needed
  const packets = splitPacket(payload, HEARTBEAT_CHUNK_SIZE, messageId, sourceAddress, sourcePort);
  
  // Send each packet via UDP
  packets.forEach((packet, index) => {
    const encodedPacket = encodePacketToBytes(packet);
    
    socket.send(encodedPacket, HEARTBEAT_TARGET_PORT, HEARTBEAT_TARGET_ADDRESS, (err) => {
      if (err) {
        console.error(`UDP Worker: Error sending heartbeat packet ${index}:`, err.message);
      } else {
        if (packets.length > 1) {
          console.log(`UDP Worker: Sent heartbeat packet ${index + 1}/${packets.length}`);
        }
      }
    });
  });
}

// 1. Listen for incoming UDP messages
socket.on('message', (msg, rinfo) => {
  try {
    // Check if message starts with magic header (0xCAFE) - binary packet format
    const msgBuffer = Buffer.from(msg);
    if (msgBuffer.length >= 2) {
      const magic = msgBuffer.readInt16BE(0);
      if (magic === 0xCAFE) {
        // This is a binary packet, forward raw data
        const data = {
          msg: msgBuffer.toString('base64'), // Convert to base64 for IPC
          rawData: msgBuffer.toString('base64'), // Include raw binary data
          sender: `${rinfo.address}:${rinfo.port}`,
          timestamp: Date.now(),
          isBinary: true
        };
        parentPort.postMessage({ type: 'UDP_MESSAGE', payload: data });
        return;
      }
    }
    
    // Try to parse as JSON (legacy format)
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
    // If message is not JSON or parsing fails, check if it's binary
    const msgBuffer = Buffer.from(msg);
    if (msgBuffer.length >= 2) {
      const magic = msgBuffer.readInt16BE(0);
      if (magic === 0xCAFE) {
        // Binary packet
        const data = {
          msg: msgBuffer.toString('base64'),
          rawData: msgBuffer.toString('base64'),
          sender: `${rinfo.address}:${rinfo.port}`,
          timestamp: Date.now(),
          isBinary: true
        };
        parentPort.postMessage({ type: 'UDP_MESSAGE', payload: data });
        return;
      }
    }
    
    // Fallback: treat as regular message
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
  socketAddress = address.address;
  socketPort = address.port;
  console.log(`UDP Worker: Listening on ${socketAddress}:${socketPort}`);
  
  // Notify Main Process that we are ready
  parentPort.postMessage({ type: 'STATUS', status: 'LISTENING' });
  
  // Start heartbeat interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  // heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
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
    const { message, port, address, isBinary } = command.payload;
    
    let messageBuffer;
    if (isBinary) {
      // Decode base64 to Buffer for binary data
      messageBuffer = Buffer.from(message, 'base64');
    } else {
      // Regular string message
      messageBuffer = Buffer.from(message);
    }

    socket.send(messageBuffer, port, address, (err) => {
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