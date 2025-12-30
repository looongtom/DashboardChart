import { dashboardConfigs } from './dashboardConfig';
import { initializeData } from './mockData';

// Mock data for session messages/newsletters
export const mockSessionMessages = [
  {
    id: 'msg1',
    name: 'Temperature Sensor Data',
    description: 'Dữ liệu cảm biến nhiệt độ từ module MCU-01',
    color: '#ff4444', // Red
    frequency: '500ms',
    recordCount: 543,
    dataPoints: [
      { id: 'temp', label: 'Nhiệt độ (°C)', color: 'rgb(255, 99, 132)' },
      { id: 'humidity', label: 'Độ ẩm (%)', color: 'rgb(75, 192, 192)' }
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
      { id: 'voltage', label: 'Điện áp (V)', color: 'rgb(54, 162, 235)' },
      { id: 'current', label: 'Dòng điện (A)', color: 'rgb(153, 102, 255)' },
      { id: 'power', label: 'Công suất (W)', color: 'rgb(255, 159, 64)' }
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
      { id: 'speed', label: 'Tốc độ (RPM)', color: 'rgb(50, 205, 50)' },
      { id: 'motor_speed', label: 'Tốc độ động cơ', color: 'rgb(72, 209, 204)' },
      { id: 'torque', label: 'Mô-men xoắn (Nm)', color: 'rgb(255, 140, 0)' }
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
      { id: 'pressure', label: 'Áp suất (kPa)', color: 'rgb(255, 205, 86)' }
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
      { id: 'frequency', label: 'Tần số (Hz)', color: 'rgb(138, 43, 226)' },
      { id: 'amplitude', label: 'Biên độ', color: 'rgb(255, 20, 147)' }
    ]
  }
];

// Mock API call to fetch session messages for a specific session
export async function fetchSessionMessages(sessionId) {
  console.log('[mockApi] Fetch session messages for session:', sessionId);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return mockSessionMessages;
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
