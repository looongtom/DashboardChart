// mock_sender.js
const dgram = require('dgram');

// Configuration matches the Electron Worker
const TARGET_PORT = 41234; // Port for sending periodic data to Electron worker
const TARGET_HOST = '127.0.0.1'; // Localhost
const LISTEN_PORT = 41235; // Port to listen for requests (different from 41234 to avoid conflict with Electron worker)

// Mock sessions data (same structure as was in ManagementsPage.jsx)
const mockSessions = [
  {
    id: 1,
    name: 'Session_TEST_1',
    status: 'ended',
    startTime: '2024-12-30 08:00',
    endTime: null,
    records: 1543
  },
  {
    id: 2,
    name: 'Session_TEST_2',
    status: 'ended',
    startTime: '2024-12-29 14:30',
    endTime: '2024-12-29 16:45',
    records: 3421
  },
  {
    id: 3,
    name: 'Session_TEST_3',
    status: 'ended',
    startTime: '2024-12-29 09:15',
    endTime: '2024-12-29 11:20',
    records: 2156
  },
  {
    id: 4,
    name: 'Session_TEST_4',
    status: 'ended',
    startTime: '2024-12-28 16:00',
    endTime: '2024-12-28 18:30',
    records: 4892
  }
];

// Mock session messages data (same structure as rawMockSessionMessages in sessionApi.js)
const mockSessionMessages = [
  {
    id: 'msg1',
    name: 'Temperature Test',
    description: 'Dữ liệu cảm biến nhiệt độ từ module Test',
    frequency: '500ms',
    recordCount: 543,
    dataPoints: [
      { id: 'temp', label: 'Nhiệt độ (°C)' },
      { id: 'temp1', label: 'Nhiệt độ (°C)' },
      { id: 'temp2', label: 'Nhiệt độ (°C)' },
      { id: 'temp3', label: 'Nhiệt độ (°C)' },
      { id: 'temp4', label: 'Nhiệt độ (°C)' },
      { id: 'temp5', label: 'Nhiệt độ (°C)' },
      { id: 'temp6', label: 'Nhiệt độ (°C)' },
      { id: 'temp7', label: 'Nhiệt độ (°C)' },
      { id: 'temp8', label: 'Nhiệt độ (°C)' },
      { id: 'temp9', label: 'Nhiệt độ (°C)' },
      { id: 'temp10', label: 'Nhiệt độ (°C)' },
      { id: 'temp11', label: 'Nhiệt độ (°C)' },
      { id: 'temp12', label: 'Nhiệt độ (°C)' },
      { id: 'temp13', label: 'Nhiệt độ (°C)' },
      { id: 'humidity', label: 'Độ ẩm (%)' }
    ]
  },
  {
    id: 'msg2',
    name: 'Voltage Monitor',
    description: 'Giám sát điện áp nguồn cấp hệ thống',
    color: '#4444ff', // Blue
    frequency: '1s',
    recordCount: 271,
    dataPoints: [
      { id: 'voltage', label: 'Điện áp (V)' },
      { id: 'current', label: 'Dòng điện (A)' },
      { id: 'power', label: 'Công suất (W)' }
    ]
  },
  {
    id: 'msg3',
    name: 'Motor Controller',
    description: 'Thông số hoạt động động cơ chính',
    frequency: '200ms',
    recordCount: 1356,
    dataPoints: [
      { id: 'speed', label: 'Tốc độ (RPM)' },
      { id: 'motor_speed', label: 'Tốc độ động cơ' },
      { id: 'torque', label: 'Mô-men xoắn (Nm)' }
    ]
  },
  {
    id: 'msg4',
    name: 'Pressure Sensor',
    description: 'Cảm biến áp suất hệ thống thủy lực',
    frequency: '1s',
    recordCount: 271,
    dataPoints: [
      { id: 'pressure', label: 'Áp suất (kPa)' }
    ]
  },
  {
    id: 'msg5',
    name: 'Frequency Analyzer',
    description: 'Phân tích tần số tín hiệu hệ thống',
    frequency: '2s',
    recordCount: 135,
    dataPoints: [
      { id: 'frequency', label: 'Tần số (Hz)' },
      { id: 'amplitude', label: 'Biên độ' }
    ]
  }
];

// Create separate sockets: one for sending periodic data, one for listening to requests
// Note: We use SO_REUSEADDR to allow binding even if Electron worker is using the port
// In practice, the Electron worker will receive requests and forward them, but we'll
// also set up a listener here as a fallback/alternative approach
const clientSocket = dgram.createSocket('udp4'); // For sending periodic data
const serverSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true }); // For receiving requests

// Chart Selection Guide:
// To visualize this mock data in the dashboard, set selectedCharts to:
// setSelectedCharts([
//   { messageId: 'msg1' }, // Temperature Sensor Data
//   { messageId: 'msg2' }, // Voltage Monitor
//   { messageId: 'msg3' }, // Motor Controller
//   { messageId: 'msg4' }, // Pressure Sensor
//   { messageId: 'msg5' }  // Frequency Analyzer
// ]);
// Note: Maximum 4 charts can be selected at once in the UI

let counter = 0;
let payloadInterval = null; // Interval for sending payload messages

// Track current recording session
let currentRecordingSession = null;
let recordingStartTime = null;
let recordingRecordCount = 0;

// Function to generate mock payload data based on mockSessionMessages
function generatePayloadData() {
  const payload = {};
  
  // Generate data for each message type
  mockSessionMessages.forEach(message => {
    message.dataPoints.forEach(dataPoint => {
      const dataPointId = dataPoint.id;
      
      // Generate realistic mock values based on data point type
      if (dataPointId.startsWith('temp')) {
        // Temperature: 20-30°C with some variation
        payload[dataPointId] = 20 + Math.random() * 10 + Math.sin(counter * 0.1) * 2;
      } else if (dataPointId === 'humidity') {
        // Humidity: 40-60%
        payload[dataPointId] = 40 + Math.random() * 20 + Math.sin(counter * 0.05) * 5;
      } else if (dataPointId === 'voltage') {
        // Voltage: 220-240V
        payload[dataPointId] = 220 + Math.random() * 20 + Math.sin(counter * 0.02) * 3;
      } else if (dataPointId === 'current') {
        // Current: 5-15A
        payload[dataPointId] = 5 + Math.random() * 10 + Math.sin(counter * 0.03) * 2;
      } else if (dataPointId === 'power') {
        // Power: 1000-3000W
        payload[dataPointId] = 1000 + Math.random() * 2000 + Math.sin(counter * 0.02) * 200;
      } else if (dataPointId === 'speed' || dataPointId === 'motor_speed') {
        // Speed: 1000-3000 RPM
        payload[dataPointId] = 1000 + Math.random() * 2000 + Math.sin(counter * 0.1) * 300;
      } else if (dataPointId === 'torque') {
        // Torque: 50-150 Nm
        payload[dataPointId] = 50 + Math.random() * 100 + Math.sin(counter * 0.08) * 20;
      } else if (dataPointId === 'pressure') {
        // Pressure: 100-500 kPa
        payload[dataPointId] = 100 + Math.random() * 400 + Math.sin(counter * 0.05) * 50;
      } else if (dataPointId === 'frequency') {
        // Frequency: 50-60 Hz
        payload[dataPointId] = 50 + Math.random() * 10 + Math.sin(counter * 0.1) * 2;
      } else if (dataPointId === 'amplitude') {
        // Amplitude: 0-100
        payload[dataPointId] = Math.abs(Math.sin(counter * 0.2) * 50 + Math.random() * 20);
      } else {
        // Default: random value between 0-100
        payload[dataPointId] = Math.random() * 100;
      }
      
      // Round to 2 decimal places
      payload[dataPointId] = Math.round(payload[dataPointId] * 100) / 100;
    });
  });
  
  return payload;
}

// Function to send payload message
function sendPayloadMessage() {
  counter++;
  const payloadData = generatePayloadData();
  const message = Buffer.from(JSON.stringify(payloadData));
  
  clientSocket.send(message, TARGET_PORT, TARGET_HOST, (err) => {
    if (err) {
      console.error('Error sending payload message:', err);
    } else {
      // console.log(`[${new Date().toLocaleTimeString()}] Sent payload #${counter}`);
    }
  });
}

// Handle incoming UDP messages (requests) on server socket
serverSocket.on('message', (msg, rinfo) => {
  try {
    const request = JSON.parse(msg.toString());
    
    // Handle GET_SESSIONS request
    if (request.type === 'GET_SESSIONS') {
      const response = {
        type: 'SESSIONS_RESPONSE',
        data: mockSessions
      };
      
      const responseBuffer = Buffer.from(JSON.stringify(response));
      // Send response back to the sender
      serverSocket.send(responseBuffer, rinfo.port, rinfo.address, (err) => {
        if (err) {
          console.error('Error sending sessions response:', err);
        } else {
          console.log(`[${new Date().toLocaleTimeString()}] Sent sessions response to ${rinfo.address}:${rinfo.port}`);
        }
      });
    }
    
    // Handle GET_SESSION_MESSAGES request
    if (request.type === 'HEARTBEAT_MESSAGES') {
      const sessionId = request.sessionId;
      // For now, return the same messages for all sessionIds
      const response = {
        type: 'SESSION_MESSAGES_RESPONSE',
        data: mockSessionMessages
      };
      
      const responseBuffer = Buffer.from(JSON.stringify(response));
      // Send response back to the sender
      serverSocket.send(responseBuffer, rinfo.port, rinfo.address, (err) => {
        if (err) {
          console.error('Error sending session messages response:', err);
        } else {
          console.log(`[${new Date().toLocaleTimeString()}] Sent session messages response for session ${sessionId} to ${rinfo.address}:${rinfo.port}`);
        }
      });
    }

    if (request.type === 'HEARTBEAT_MESSAGES') {
      const timestamp = request.timestamp;
      console.log(`[${new Date().toLocaleTimeString()}] Received heartbeat message at timestamp: ${timestamp}`);
    }

    // Handle DETAIL_SESSION_START request
    if (request.type === 'DETAIL_SESSION_START') {
      // Stop any existing interval
      if (payloadInterval) {
        clearInterval(payloadInterval);
        payloadInterval = null;
      }
      
      // Start sending payload messages
      counter = 0;
      payloadInterval = setInterval(sendPayloadMessage, 1000); // Send every 100ms (10 times per second)
      console.log(`[${new Date().toLocaleTimeString()}] Started sending payload messages (interval: 100ms)`);
      
      // Send acknowledgment response
      const response = {
        type: 'DETAIL_SESSION_START_RESPONSE',
        status: 'started',
        timestamp: Date.now()
      };
      
      const responseBuffer = Buffer.from(JSON.stringify(response));
      serverSocket.send(responseBuffer, rinfo.port, rinfo.address, (err) => {
        if (err) {
          console.error('Error sending DETAIL_SESSION_START response:', err);
        } else {
          console.log(`[${new Date().toLocaleTimeString()}] Sent DETAIL_SESSION_START response to ${rinfo.address}:${rinfo.port}`);
        }
      });
    }

    // Handle DETAIL_SESSION_END request
    if (request.type === 'DETAIL_SESSION_END') {
      // Stop sending payload messages
      if (payloadInterval) {
        clearInterval(payloadInterval);
        payloadInterval = null;
        console.log(`[${new Date().toLocaleTimeString()}] Stopped sending payload messages`);
      }
      
      // Send acknowledgment response
      const response = {
        type: 'DETAIL_SESSION_END_RESPONSE',
        status: 'stopped',
        timestamp: Date.now()
      };
      
      const responseBuffer = Buffer.from(JSON.stringify(response));
      serverSocket.send(responseBuffer, rinfo.port, rinfo.address, (err) => {
        if (err) {
          console.error('Error sending DETAIL_SESSION_END response:', err);
        } else {
          console.log(`[${new Date().toLocaleTimeString()}] Sent DETAIL_SESSION_END response to ${rinfo.address}:${rinfo.port}`);
        }
      });
    }

    // Handle START_RECORDING_SESSION request
    if (request.type === 'START_RECORDING_SESSION') {
      // Check if there's already a recording session running
      if (currentRecordingSession) {
        console.log(`[${new Date().toLocaleTimeString()}] Recording session already running: ${currentRecordingSession.sessionId}`);
        // Still send response with existing session
        const response = {
          type: 'RECORDING_SESSION_STARTED',
          data: {
            sessionId: currentRecordingSession.sessionId,
            sessionName: currentRecordingSession.sessionName,
            startTime: currentRecordingSession.startTime
          }
        };
        
        const responseBuffer = Buffer.from(JSON.stringify(response));
        serverSocket.send(responseBuffer, rinfo.port, rinfo.address, (err) => {
          if (err) {
            console.error('Error sending RECORDING_SESSION_STARTED response:', err);
          } else {
            console.log(`[${new Date().toLocaleTimeString()}] Sent RECORDING_SESSION_STARTED response to ${rinfo.address}:${rinfo.port}`);
          }
        });
        return;
      }

      // Generate new session ID (use timestamp + random number)
      const sessionId = Date.now();
      const sessionName = `Session_REC_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}_${sessionId % 10000}`;
      const startTime = new Date().toISOString();
      
      // Initialize recording session
      currentRecordingSession = {
        sessionId: sessionId,
        sessionName: sessionName,
        startTime: startTime
      };
      recordingStartTime = Date.now();
      recordingRecordCount = 0;
      
      console.log(`[${new Date().toLocaleTimeString()}] Started recording session: ${sessionName} (ID: ${sessionId})`);
      
      // Send response
      const response = {
        type: 'RECORDING_SESSION_STARTED',
        data: {
          sessionId: sessionId,
          sessionName: sessionName,
          startTime: startTime
        }
      };
      
      const responseBuffer = Buffer.from(JSON.stringify(response));
      serverSocket.send(responseBuffer, rinfo.port, rinfo.address, (err) => {
        if (err) {
          console.error('Error sending RECORDING_SESSION_STARTED response:', err);
        } else {
          console.log(`[${new Date().toLocaleTimeString()}] Sent RECORDING_SESSION_STARTED response to ${rinfo.address}:${rinfo.port}`);
        }
      });
    }

    // Handle STOP_RECORDING_SESSION request
    if (request.type === 'STOP_RECORDING_SESSION') {
      const requestedSessionId = request.sessionId;
      
      // Check if there's a recording session
      if (!currentRecordingSession) {
        console.log(`[${new Date().toLocaleTimeString()}] No recording session to stop`);
        // Send error response or empty response
        const response = {
          type: 'RECORDING_SESSION_STOPPED',
          data: {
            sessionId: requestedSessionId || null,
            endTime: new Date().toISOString(),
            totalRecords: 0
          }
        };
        
        const responseBuffer = Buffer.from(JSON.stringify(response));
        serverSocket.send(responseBuffer, rinfo.port, rinfo.address, (err) => {
          if (err) {
            console.error('Error sending RECORDING_SESSION_STOPPED response:', err);
          } else {
            console.log(`[${new Date().toLocaleTimeString()}] Sent RECORDING_SESSION_STOPPED response (no active session) to ${rinfo.address}:${rinfo.port}`);
          }
        });
        return;
      }

      // Check if sessionId matches (if provided)
      if (requestedSessionId && currentRecordingSession.sessionId !== requestedSessionId) {
        console.log(`[${new Date().toLocaleTimeString()}] Session ID mismatch. Requested: ${requestedSessionId}, Current: ${currentRecordingSession.sessionId}`);
        // Still send response with current session
      }

      // Calculate duration and generate mock record count
      const endTime = new Date().toISOString();
      const duration = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0; // seconds
      // Generate mock record count based on duration (assume ~10 records per second)
      const totalRecords = Math.floor(duration * 10) + Math.floor(Math.random() * 100);
      
      const stoppedSessionData = {
        sessionId: currentRecordingSession.sessionId,
        endTime: endTime,
        totalRecords: totalRecords
      };
      
      console.log(`[${new Date().toLocaleTimeString()}] Stopped recording session: ${currentRecordingSession.sessionName} (ID: ${currentRecordingSession.sessionId}), Records: ${totalRecords}`);
      
      // Clear recording session
      currentRecordingSession = null;
      recordingStartTime = null;
      recordingRecordCount = 0;
      
      // Send response
      const response = {
        type: 'RECORDING_SESSION_STOPPED',
        data: stoppedSessionData
      };
      
      const responseBuffer = Buffer.from(JSON.stringify(response));
      serverSocket.send(responseBuffer, rinfo.port, rinfo.address, (err) => {
        if (err) {
          console.error('Error sending RECORDING_SESSION_STOPPED response:', err);
        } else {
          console.log(`[${new Date().toLocaleTimeString()}] Sent RECORDING_SESSION_STOPPED response to ${rinfo.address}:${rinfo.port}`);
        }
      });
    }

  } catch (error) {
    // Not a JSON request or invalid format, ignore
    // (might be other UDP traffic or periodic data)
  }
});

// Bind server socket to listen on port 41235 for requests
serverSocket.bind(LISTEN_PORT, () => {
  const address = serverSocket.address();
  console.log(`📡 Server socket listening on: ${address.address}:${address.port} for requests`);
});

console.log(`🚀 Mock UDP Sender/Server started.`);
console.log(`Sending periodic data to: ${TARGET_HOST}:${TARGET_PORT}`);
console.log(`Attempting to listen for requests on: ${LISTEN_PORT}`);
console.log('Press Ctrl+C to stop.');
console.log('\n📊 Chart Selection Guide:');
console.log('   - msg1: Temperature Sensor Data (temp, temp1-13, humidity)');
console.log('   - msg2: Voltage Monitor (voltage, current, power)');
console.log('   - msg3: Motor Controller (speed, motor_speed, torque)');
console.log('   - msg4: Pressure Sensor (pressure)');
console.log('   - msg5: Frequency Analyzer (frequency, amplitude)');
console.log('   Select these message IDs in the dashboard to visualize the data.');
console.log('\n📋 Sessions API:');
console.log('   - Listening for GET_SESSIONS requests');
console.log('   - Listening for GET_SESSION_MESSAGES requests');
console.log('   - Listening for DETAIL_SESSION_START requests (starts payload messages)');
console.log('   - Listening for DETAIL_SESSION_END requests (stops payload messages)');
console.log('   - Listening for START_RECORDING_SESSION requests (starts background recording)');
console.log('   - Listening for STOP_RECORDING_SESSION requests (stops background recording)');
console.log('   - Will respond with mock sessions and session messages data\n');

setInterval(() => {
  counter++;

  // Create HEARTBEAT_MESSAGES payload
  const heartbeatMessage = JSON.stringify({
    type: 'HEARTBEAT_MESSAGES',
    timestamp: Date.now()
  });

  const message = Buffer.from(heartbeatMessage);

  // Send HEARTBEAT_MESSAGES to TARGET_PORT using client socket
  clientSocket.send(message, TARGET_PORT, TARGET_HOST, (err) => {
    if (err) {
      console.error('Error sending heartbeat message:', err);
    } else {
      // console.log(`[${new Date().toLocaleTimeString()}] Sent heartbeat #${counter}: ${heartbeatMessage}`);
    }
  });
}, 1000); // Send every 1 second

// Handle socket errors
clientSocket.on('error', (err) => {
  console.error('Client socket error:', err);
});

serverSocket.on('error', (err) => {
  // Ignore EADDRINUSE errors as they're expected if Electron worker is using the port
  if (err.code !== 'EADDRINUSE') {
    console.error('Server socket error:', err);
  }
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  
  // Stop payload interval if running
  if (payloadInterval) {
    clearInterval(payloadInterval);
    payloadInterval = null;
  }
  
  clientSocket.close();
  serverSocket.close();
  process.exit(0);
});