import { dashboardConfigs } from './dashboardConfig';
import { initializeData } from './mockData';

// Mock API call to fetch dashboard data for a specific session
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