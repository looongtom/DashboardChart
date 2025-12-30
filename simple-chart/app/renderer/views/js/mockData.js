// Initialize data with timestamps (starting from 30 seconds ago)
export function initializeData(dashboardConfigs) {
  const now = Date.now();
  const thirtySecondsAgo = now - (30 * 1000);
  const interval = 1000; // 1 second between data points
  
  // Initialize data for each dashboard's datasets
  dashboardConfigs.forEach(config => {
    config.datasets.forEach(dataset => {
      for (let i = 0; i < 30; i++) {
        const timestamp = thirtySecondsAgo + (i * interval);
        dataset.data.push({
          timestamp: timestamp,
          count: dataset.baseValue + Math.floor(Math.random() * 20)
        });
      }
    });
  });
  
  return dashboardConfigs;
}

// Function to generate mock data - adds new point every second for each dataset
export function generateMockData(dashboardConfigs) {
  const now = Date.now();
  
  dashboardConfigs.forEach(config => {
    config.datasets.forEach(dataset => {
      const lastTimestamp = dataset.data[dataset.data.length - 1].timestamp;
      
      // Add a new data point every second
      if (now - lastTimestamp >= 1000) {
        const lastCount = dataset.data[dataset.data.length - 1].count;
        // Each dataset has different variation ranges for more interesting visualization
        const variation = Math.floor(Math.random() * 10) - 5;
        const newCount = Math.max(0, lastCount + variation);
        dataset.data.push({
          timestamp: now,
          count: newCount
        });
        
        // Keep the last 300 data points (5 minutes of data) for historical viewing
        if (dataset.data.length > 300) {
          dataset.data = dataset.data.slice(-300);
        }
      }
    });
  });
  
  return dashboardConfigs;
}

