import React, { useEffect, useRef } from 'react';
import { dashboardConfigs } from '../js/dashboardConfig';
import { initializeData, generateMockData } from '../js/mockData';
import { createCharts, updateCharts } from '../js/chartManager';

function DashboardPage() {
  const chartsRef = useRef([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initialize data for all dashboards
    const initializedConfigs = initializeData(dashboardConfigs);
    
    // Create chart instances
    const charts = createCharts(initializedConfigs);
    chartsRef.current = charts;
    
    // Update charts every second (1000ms) for real-time visualization
    intervalRef.current = setInterval(() => {
      const updatedConfigs = generateMockData(dashboardConfigs);
      updateCharts(chartsRef.current, updatedConfigs);
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Destroy charts
      chartsRef.current.forEach(chart => {
        if (chart && chart.destroy) {
          chart.destroy();
        }
      });
    };
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-panel">
        <h3>Dashboard 1 - Many Legends</h3>
        <div id="legend-dashboard1" className="custom-legend"></div>
        <canvas id="dashboard1"></canvas>
      </div>
      <div className="dashboard-panel">
        <h3>Dashboard 2</h3>
        <div id="legend-dashboard2" className="custom-legend"></div>
        <canvas id="dashboard2"></canvas>
      </div>
      <div className="dashboard-panel">
        <h3>Dashboard 3</h3>
        <div id="legend-dashboard3" className="custom-legend"></div>
        <canvas id="dashboard3"></canvas>
      </div>
      <div className="dashboard-panel">
        <h3>Dashboard 4</h3>
        <div id="legend-dashboard4" className="custom-legend"></div>
        <canvas id="dashboard4"></canvas>
      </div>
    </div>
  );
}

export default DashboardPage;

