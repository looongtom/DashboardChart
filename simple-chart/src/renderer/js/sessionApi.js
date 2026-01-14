import { dashboardConfigs } from './dashboardConfig';
import { initializeData } from './mockData';
import { assignDataPointColors } from './dataPointColors';

// Mock data for session messages/newsletters
// Lưu ý: dataPoints không có màu sắc, sẽ được gán tự động khi fetch
const rawMockSessionMessages = [
  {
    id: 'msg1',
    name: 'Temperature Sensor Data',
    description: 'Dữ liệu cảm biến nhiệt độ từ module MCU-01',
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

// Fetch session messages for a specific session via UDP request
export async function fetchSessionMessages(sessionId) {
  console.log('[sessionApi] Fetching session messages for session:', sessionId, 'via UDP...');

  return new Promise((resolve, reject) => {
    // Check if electronAPI is available
    if (!window.electronAPI || !window.electronAPI.sendUdp || !window.electronAPI.subscribeUdpData) {
      reject(new Error('electronAPI not available'));
      return;
    }

    let responseReceived = false;
    let unsubscribe = null;
    
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        responseReceived = true;
        if (unsubscribe) unsubscribe();
        reject(new Error('Timeout: No response received from UDP server'));
      }
    }, 5000); // 5 second timeout

    // Set up one-time listener for UDP response
    const handleUdpResponse = (udpPayload) => {
      if (responseReceived) return;

      try {
        const { msg } = udpPayload;
        let parsedData;
        
        try {
          parsedData = JSON.parse(msg);
        } catch (e) {
          // Not a JSON response, ignore
          return;
        }

        // Check if this is a SESSION_MESSAGES_RESPONSE
        if (parsedData.type === 'SESSION_MESSAGES_RESPONSE' && Array.isArray(parsedData.data)) {
          responseReceived = true;
          clearTimeout(timeout);
          if (unsubscribe) unsubscribe();
          console.log('[sessionApi] Received session messages:', parsedData.data);

          // Gán màu tự động cho các data points (giả lập dữ liệu thực tế không có màu)
          const messagesWithColors = parsedData.data.map(message => ({
            ...message,
            dataPoints: assignDataPointColors(message.dataPoints)
          }));

          resolve(messagesWithColors);
        }
      } catch (error) {
        console.error('[sessionApi] Error parsing UDP response:', error);
        // Continue listening for valid response
      }
    };

    // Subscribe to SESSION_MESSAGES_RESPONSE type
    unsubscribe = window.electronAPI.subscribeUdpData('SESSION_MESSAGES_RESPONSE', handleUdpResponse);

    // Send UDP request to mock_sender (on port 41235 to avoid conflict with Electron worker on 41234)
    const request = JSON.stringify({ type: 'GET_SESSION_MESSAGES', sessionId: sessionId });
    window.electronAPI.sendUdp({
      message: request,
      address: '127.0.0.1',
      port: 41235
    }).catch((error) => {
      if (!responseReceived) {
        responseReceived = true;
        clearTimeout(timeout);
        if (unsubscribe) unsubscribe();
        reject(new Error(`Failed to send UDP request: ${error.message}`));
      }
    });
  });
}

// Mock API call to fetch dashboard data for a specific session (legacy, kept for compatibility)
export async function fetchSessionDashboardData(sessionId) {
  console.log('[mockApi] Fetch dashboard data for session:', sessionId);

  // Clone configs so each session has its own data instance
  const clonedConfigs = JSON.parse(JSON.stringify(dashboardConfigs));

  // Initialize data (timestamps + random values)
  const initializedConfigs = initializeData(clonedConfigs);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return initializedConfigs;
}

// Fetch sessions list via UDP request
export async function fetchSessions() {
  console.log('[sessionApi] Fetching sessions via UDP...');

  return new Promise((resolve, reject) => {
    // Check if electronAPI is available
    if (!window.electronAPI || !window.electronAPI.sendUdp || !window.electronAPI.subscribeUdpData) {
      reject(new Error('electronAPI not available'));
      return;
    }

    let responseReceived = false;
    let unsubscribe = null;
    
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        responseReceived = true;
        if (unsubscribe) unsubscribe();
        reject(new Error('Timeout: No response received from UDP server'));
      }
    }, 5000); // 5 second timeout

    // Set up one-time listener for UDP response
    const handleUdpResponse = (udpPayload) => {
      if (responseReceived) return;

      try {
        const { msg } = udpPayload;
        let parsedData;
        
        try {
          parsedData = JSON.parse(msg);
        } catch (e) {
          // Not a JSON response, ignore
          return;
        }

        // Check if this is a SESSIONS_RESPONSE
        if (parsedData.type === 'SESSIONS_RESPONSE' && Array.isArray(parsedData.data)) {
          responseReceived = true;
          clearTimeout(timeout);
          if (unsubscribe) unsubscribe();
          console.log('[sessionApi] Received sessions:', parsedData.data);
          resolve(parsedData.data);
        }
      } catch (error) {
        console.error('[sessionApi] Error parsing UDP response:', error);
        // Continue listening for valid response
      }
    };

    // Subscribe to SESSIONS_RESPONSE type
    unsubscribe = window.electronAPI.subscribeUdpData('SESSIONS_RESPONSE', handleUdpResponse);

    // Send UDP request to mock_sender (on port 41235 to avoid conflict with Electron worker on 41234)
    const request = JSON.stringify({ type: 'GET_SESSIONS' });
    window.electronAPI.sendUdp({
      message: request,
      address: '127.0.0.1',
      port: 41235
    }).catch((error) => {
      if (!responseReceived) {
        responseReceived = true;
        clearTimeout(timeout);
        if (unsubscribe) unsubscribe();
        reject(new Error(`Failed to send UDP request: ${error.message}`));
      }
    });
  });
}

// Send DETAIL_SESSION_START request to start payload message streaming
export async function startDetailSession() {
  console.log('[sessionApi] Sending DETAIL_SESSION_START request...');
  
  if (!window.electronAPI || !window.electronAPI.sendUdp) {
    console.warn('[sessionApi] electronAPI.sendUdp not available');
    return;
  }

  try {
    const request = JSON.stringify({ type: 'DETAIL_SESSION_START' });
    await window.electronAPI.sendUdp({
      message: request,
      address: '127.0.0.1',
      port: 41235
    });
    console.log('[sessionApi] DETAIL_SESSION_START request sent successfully');
  } catch (error) {
    console.error('[sessionApi] Error sending DETAIL_SESSION_START request:', error);
  }
}

// Send DETAIL_SESSION_END request to stop payload message streaming
export async function stopDetailSession() {
  console.log('[sessionApi] Sending DETAIL_SESSION_END request...');
  
  if (!window.electronAPI || !window.electronAPI.sendUdp) {
    console.warn('[sessionApi] electronAPI.sendUdp not available');
    return;
  }

  try {
    const request = JSON.stringify({ type: 'DETAIL_SESSION_END' });
    await window.electronAPI.sendUdp({
      message: request,
      address: '127.0.0.1',
      port: 41235
    });
    console.log('[sessionApi] DETAIL_SESSION_END request sent successfully');
  } catch (error) {
    console.error('[sessionApi] Error sending DETAIL_SESSION_END request:', error);
  }
}

// Start a new recording session (Background Recording)
export async function startRecordingSession() {
  console.log('[sessionApi] Starting new recording session...');
  
  if (!window.electronAPI || !window.electronAPI.sendUdp) {
    console.warn('[sessionApi] electronAPI.sendUdp not available');
    throw new Error('electronAPI.sendUdp not available');
  }

  return new Promise((resolve, reject) => {
    let responseReceived = false;
    let unsubscribe = null;
    
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        responseReceived = true;
        if (unsubscribe) unsubscribe();
        reject(new Error('Timeout: No response received from UDP server'));
      }
    }, 5000);

    const handleUdpResponse = (udpPayload) => {
      if (responseReceived) return;

      try {
        const { msg } = udpPayload;
        let parsedData;
        
        try {
          parsedData = JSON.parse(msg);
        } catch (e) {
          return;
        }

        if (parsedData.type === 'RECORDING_SESSION_STARTED' && parsedData.data) {
          responseReceived = true;
          clearTimeout(timeout);
          if (unsubscribe) unsubscribe();
          console.log('[sessionApi] Recording session started:', parsedData.data);
          resolve(parsedData.data); // { sessionId, sessionName, startTime }
        }
      } catch (error) {
        console.error('[sessionApi] Error parsing UDP response:', error);
      }
    };

    // Subscribe to RECORDING_SESSION_STARTED type
    unsubscribe = window.electronAPI.subscribeUdpData('RECORDING_SESSION_STARTED', handleUdpResponse);

    const request = JSON.stringify({ type: 'START_RECORDING_SESSION' });
    window.electronAPI.sendUdp({
      message: request,
      address: '127.0.0.1',
      port: 41235
    }).catch((error) => {
      if (!responseReceived) {
        responseReceived = true;
        clearTimeout(timeout);
        if (unsubscribe) unsubscribe();
        reject(new Error(`Failed to send UDP request: ${error.message}`));
      }
    });
  });
}

// Stop the current recording session
export async function stopRecordingSession(sessionId) {
  console.log('[sessionApi] Stopping recording session:', sessionId);
  
  if (!window.electronAPI || !window.electronAPI.sendUdp) {
    console.warn('[sessionApi] electronAPI.sendUdp not available');
    throw new Error('electronAPI.sendUdp not available');
  }

  return new Promise((resolve, reject) => {
    let responseReceived = false;
    let unsubscribe = null;
    
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        responseReceived = true;
        if (unsubscribe) unsubscribe();
        reject(new Error('Timeout: No response received from UDP server'));
      }
    }, 5000);

    const handleUdpResponse = (udpPayload) => {
      if (responseReceived) return;

      try {
        const { msg } = udpPayload;
        let parsedData;
        
        try {
          parsedData = JSON.parse(msg);
        } catch (e) {
          return;
        }

        if (parsedData.type === 'RECORDING_SESSION_STOPPED' && parsedData.data) {
          responseReceived = true;
          clearTimeout(timeout);
          if (unsubscribe) unsubscribe();
          console.log('[sessionApi] Recording session stopped:', parsedData.data);
          resolve(parsedData.data); // { sessionId, endTime, totalRecords }
        }
      } catch (error) {
        console.error('[sessionApi] Error parsing UDP response:', error);
      }
    };

    // Subscribe to RECORDING_SESSION_STOPPED type
    unsubscribe = window.electronAPI.subscribeUdpData('RECORDING_SESSION_STOPPED', handleUdpResponse);

    const request = JSON.stringify({ 
      type: 'STOP_RECORDING_SESSION',
      sessionId: sessionId
    });
    window.electronAPI.sendUdp({
      message: request,
      address: '127.0.0.1',
      port: 41235
    }).catch((error) => {
      if (!responseReceived) {
        responseReceived = true;
        clearTimeout(timeout);
        if (unsubscribe) unsubscribe();
        reject(new Error(`Failed to send UDP request: ${error.message}`));
      }
    });
  });
}
