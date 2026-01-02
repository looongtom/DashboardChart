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
    color: '#ff4444', // Red
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
    color: '#44ff44', // Green
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
    color: '#ff8844', // Orange
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
    color: '#8844ff', // Purple
    frequency: '2s',
    recordCount: 135,
    dataPoints: [
      { id: 'frequency', label: 'Tần số (Hz)' },
      { id: 'amplitude', label: 'Biên độ' }
    ]
  }
];

// Mock API call to fetch session messages for a specific session
export async function fetchSessionMessages(sessionId) {
  console.log('[mockApi] Fetch session messages for session:', sessionId);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Gán màu tự động cho các data points (giả lập dữ liệu thực tế không có màu)
  const messagesWithColors = rawMockSessionMessages.map(message => ({
    ...message,
    dataPoints: assignDataPointColors(message.dataPoints)
  }));

  return messagesWithColors;
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
