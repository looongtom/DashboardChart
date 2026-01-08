const dgram = require('dgram');

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

// ============== IP Address Helper ==============
function bytesToIpAddress(bytes) {
  if (bytes.length === 4) {
    // IPv4
    return bytes.join('.');
  } else if (bytes.length === 16) {
    // IPv6
    const parts = [];
    for (let i = 0; i < 16; i += 2) {
      const hex = ((bytes[i] << 8) | bytes[i + 1]).toString(16);
      parts.push(hex);
    }
    return parts.join(':');
  }
  throw new Error('Invalid IP address length');
}

// ============== Decode Function ==============
function decodeFromBytes(data) {
  const buffer = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;

  // Read magic (2 bytes, signed short)
  const magic = buffer.getInt16(offset);
  offset += 2;
  
  if (magic !== (0xCAFE << 16) >> 16) {
    throw new Error('Invalid sdk magic header!');
  }

  // Read messageId (8 bytes, signed long)
  const messageId = buffer.getBigInt64(offset);
  offset += 8;

  // Read totalLength (4 bytes, signed int)
  const totalLength = buffer.getInt32(offset);
  offset += 4;

  // Read payloadLen (4 bytes, signed int)
  const payloadLen = buffer.getInt32(offset);
  offset += 4;

  // Read ipVersion (1 byte)
  const ipVersion = buffer.getInt8(offset);
  offset += 1;

  const ipLength = ipVersion === 4 ? 4 : 16;

  // Read IP address bytes
  const ipBytes = [];
  for (let i = 0; i < ipLength; i++) {
    ipBytes.push(buffer.getUint8(offset));
    offset += 1;
  }

  const sourceAddress = bytesToIpAddress(ipBytes);

  // Read sourcePort (2 bytes, unsigned short)
  const sourcePort = buffer.getUint16(offset);
  offset += 2;

  // Read chunkIndex (4 bytes, signed int)
  const chunkIndex = buffer.getInt32(offset);
  offset += 4;

  // Read totalChunk (4 bytes, signed int)
  const totalChunk = buffer.getInt32(offset);
  offset += 4;

  // Read checksum (8 bytes, signed long)
  const checksum = buffer.getBigInt64(offset);
  offset += 8;

  // Read payload
  const payload = new Uint8Array(payloadLen);
  for (let i = 0; i < payloadLen; i++) {
    payload[i] = buffer.getUint8(offset);
    offset += 1;
  }

  // Verify checksum
  const actualChecksumValue = convertToCrc32(payload);
  
  if (BigInt(actualChecksumValue) !== checksum) {
    throw new Error('Checksum mismatch!');
  }

  // Create and populate packet
  const packet = new Packet(messageId, payload);
  packet.setSourceAddress(sourceAddress);
  packet.setSourcePort(sourcePort);
  packet.setChunkIndex(chunkIndex);
  packet.setTotalChunk(totalChunk);
  packet.setTotalPayloadLength(totalLength);

  return packet;
}

// ============== Packet Handler Class ==============
class PacketHandler {
  constructor() {
    this.packetListMap = new Map(); // Map<messageId, Packet[]>
  }

  /**
   * Handle incoming packet data
   * @param {Buffer} rawData - Raw byte data from UDP
   * @param {Function} mergeCallback - Function to call when all chunks received
   * @returns {Packet|null} - Returns merged packet if complete, null otherwise
   */
  handlePacket(rawData, mergeCallback) {
    try {
      // Convert Buffer to Uint8Array
      const uint8Data = new Uint8Array(rawData);
      
      // Step 1: Get packet data
      const packet = decodeFromBytes(uint8Data);

      // Step 2: Get packet id and total chunk
      const packetId = packet.messageId.toString();
      const totalChunk = packet.totalChunk;

      // Step 3: Update packetListMap
      if (!this.packetListMap.has(packetId)) {
        this.packetListMap.set(packetId, []);
      }
      
      const packetList = this.packetListMap.get(packetId);
      packetList.push(packet);

      console.log(`Received chunk ${packet.chunkIndex + 1}/${totalChunk} for message ${packetId}`);

      // Step 4: Get list packet by packet id
      const currentPacketList = this.packetListMap.get(packetId);

      // Step 5: Compare list size and total chunk
      if (currentPacketList.length === totalChunk) {
        console.log(`All chunks received for message ${packetId}. Merging...`);
        
        // All chunks received, call merge function
        const mergedPacket = mergeCallback(currentPacketList);
        
        // Clean up the map after merging
        this.packetListMap.delete(packetId);
        
        // Step 6: Return final merged packet
        return mergedPacket;
      }

      // Not all chunks received yet
      return null;
    } catch (error) {
      console.error('Error handling packet:', error.message);
      return null;
    }
  }

  /**
   * Get current state of packets for a specific message ID
   * @param {BigInt|string} messageId
   * @returns {Packet[]|null}
   */
  getPacketList(messageId) {
    const key = messageId.toString();
    return this.packetListMap.get(key) || null;
  }

  /**
   * Get progress for a specific message ID
   * @param {BigInt|string} messageId
   * @returns {Object} - {received, total, complete}
   */
  getProgress(messageId) {
    const key = messageId.toString();
    const packets = this.packetListMap.get(key);
    
    if (!packets || packets.length === 0) {
      return { received: 0, total: 0, complete: false };
    }

    const total = packets[0].totalChunk;
    const received = packets.length;
    
    return {
      received,
      total,
      complete: received === total
    };
  }

  /**
   * Clear all packets for a specific message ID
   * @param {BigInt|string} messageId
   */
  clearPackets(messageId) {
    const key = messageId.toString();
    this.packetListMap.delete(key);
  }

  /**
   * Clear all stored packets
   */
  clearAll() {
    this.packetListMap.clear();
  }
}

// ============== Merge Function (Placeholder) ==============
function mergePackets(packetList) {
  // Sort packets by chunk index
  packetList.sort((a, b) => a.chunkIndex - b.chunkIndex);
  
  // Calculate total length
  const totalLength = packetList.reduce((sum, p) => sum + p.payload.length, 0);
  const mergedPayload = new Uint8Array(totalLength);
  
  // Concatenate all payloads
  let offset = 0;
  for (const packet of packetList) {
    mergedPayload.set(packet.payload, offset);
    offset += packet.payload.length;
  }
  
  // Create final packet
  const finalPacket = new Packet(packetList[0].messageId, mergedPayload);
  finalPacket.setSourceAddress(packetList[0].sourceAddress);
  finalPacket.setSourcePort(packetList[0].sourcePort);
  finalPacket.setTotalPayloadLength(packetList[0].totalPayloadLength);
  finalPacket.setChunkIndex(0);
  finalPacket.setTotalChunk(1);
  
  return finalPacket;
}

// ============== UDP Server Setup ==============
const PORT = 8080; // Change to your desired port
const handler = new PacketHandler();

const serverSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

serverSocket.on('message', (msg, rinfo) => {
  console.log(`Received ${msg.length} bytes from ${rinfo.address}:${rinfo.port}`);
  
  const rawData = msg; // This is raw data
  
  // Handle the packet
  const result = handler.handlePacket(rawData, mergePackets);
  
  if (result !== null) {
    console.log('✓ Complete message received!');
    console.log('Message ID:', result.messageId.toString());
    console.log('Total payload length:', result.payload.length);
    console.log('Source:', result.sourceAddress, ':', result.sourcePort);
    
    // Process your complete merged packet here
    // For example, convert payload to string if it's text:
    const text = Buffer.from(result.payload).toString('utf8');
    console.log('Payload:', text);
  }
});

serverSocket.on('listening', () => {
  const address = serverSocket.address();
  console.log(`UDP Server listening on ${address.address}:${address.port}`);
});

serverSocket.on('error', (err) => {
  console.error('Server error:', err);
  serverSocket.close();
});

serverSocket.bind(PORT);

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

// ============== Example Usage for Splitting ==============
/*
// Example: Split and send data
const payload = Buffer.from('Trinh Minh Tuan'.repeat(1000));
const chunkSize = 1024; // 1KB chunks
const messageId = Date.now();
const sourceAddress = '192.168.1.100';
const sourcePort = 5000;

const packets = splitPacket(payload, chunkSize, messageId, sourceAddress, sourcePort);

console.log(`Split into ${packets.length} packets`);

// Send each packet via UDP
const client = dgram.createSocket('udp4');
const targetHost = '127.0.0.1';
const targetPort = 8080;

packets.forEach((packet, index) => {
  const encodedPacket = encodePacketToBytes(packet);
  
  client.send(encodedPacket, targetPort, targetHost, (err) => {
    if (err) {
      console.error(`Error sending packet ${index}:`, err);
    } else {
      console.log(`Sent packet ${index + 1}/${packets.length}`);
    }
    
    // Close client after last packet
    if (index === packets.length - 1) {
      client.close();
    }
  });
});
*/

// ============== Export ==============
module.exports = {
  Packet,
  PacketHandler,
  decodeFromBytes,
  convertToCrc32,
  mergePackets,
  splitPacket,
  encodePacketToBytes,
  calculateMetadataLength
};