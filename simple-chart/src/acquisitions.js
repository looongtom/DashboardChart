import { dashboardConfigs } from './dashboardConfig.js'
import { initializeData, generateMockData } from './mockData.js'
import { createCharts, updateCharts } from './chartManager.js'

(async function() {
  // Initialize data for all dashboards
  const initializedConfigs = initializeData(dashboardConfigs);
  
  // Create chart instances
  const charts = createCharts(initializedConfigs);
  
  // Update charts every second (1000ms) for real-time visualization
  setInterval(() => {
    const updatedConfigs = generateMockData(dashboardConfigs);
    updateCharts(charts, updatedConfigs);
  }, 1000);
})();
