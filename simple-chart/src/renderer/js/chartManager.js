import Chart from 'chart.js/auto'
import 'chartjs-adapter-date-fns'
import zoomPlugin from 'chartjs-plugin-zoom'
import { timeScaleAdjustPlugin, verticalHoverLinePlugin } from './plugins.js'
import { createCustomLegend } from './legend.js'

// Configuration for sliding window (time range to display)
const SLIDING_WINDOW_SIZE = 5 * 60 * 1000; // 5 minutes in milliseconds

// Create chart instances for each dashboard
export function createCharts(dashboardConfigs) {
  const charts = dashboardConfigs.map((config) => {
    const chart = new Chart(
      document.getElementById(config.id),
      {
        type: 'line',
        plugins: [zoomPlugin, timeScaleAdjustPlugin, verticalHoverLinePlugin],
        data: {
          datasets: config.datasets.map(dataset => ({
            label: dataset.label,
            data: dataset.data.map(row => ({
              x: row.timestamp,
              y: row.count
            })),
            borderColor: dataset.color,
            backgroundColor: dataset.color.replace('rgb(', 'rgba(').replace(')', ', 0.2)'),
            tension: 0.1,
            pointRadius: 2,
            fill: false
          }))
        },
        options: {
          animation: {
            duration: 0 // Disable animation for real-time updates
          },
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'second',
                stepSize: 5,
                displayFormats: {
                  second: 'HH:mm:ss',
                  minute: 'HH:mm',
                  hour: 'HH:mm'
                },
                tooltipFormat: 'HH:mm:ss'
              },
              title: {
                display: true,
                text: 'Time'
              },
              ticks: {
                source: 'auto',
                maxRotation: 45,
                minRotation: 0,
                autoSkip: true,
                maxTicksLimit: 10,
                padding: 5
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Count'
              }
            }
          },
          plugins: {
            legend: {
              display: false // Disable built-in legend, use custom HTML legend instead
            },
            tooltip: {
              intersect: false,
              mode: 'index'
            },
            zoom: {
              pan: {
                enabled: true,
                mode: 'x',
                modifierKey: null, // Allow panning without modifier key
                threshold: 10
              },
              zoom: {
                wheel: {
                  enabled: true,
                  modifierKey: 'ctrl', // Ctrl + wheel to zoom
                },
                pinch: {
                  enabled: true
                },
                mode: 'x',
                limits: {
                  x: {
                    min: 'original',
                    max: 'original'
                  }
                }
              },
              reset: {
                enabled: true
              }
            }
          },
          interaction: {
            mode: 'index',
            intersect: false
          }
        }
      }
    );
    
    // Create custom legend for this chart
    createCustomLegend(chart, `legend-${config.id}`);
    
    return chart;
  });

  // Add double-click event listener to reset zoom for each chart
  charts.forEach((chart) => {
    const canvas = chart.canvas;
    
    canvas.addEventListener('dblclick', (e) => {
      e.preventDefault();
      // Reset zoom - auto-scroll will resume on next update
      // Try to use resetZoom method if available
      if (chart.resetZoom && typeof chart.resetZoom === 'function') {
        chart.resetZoom();
      } else {
        // Fallback: manually reset scales to original
        const xScale = chart.scales.x;
        if (xScale) {
          xScale.options.min = undefined;
          xScale.options.max = undefined;
          chart.update('none');
        }
      }
    });
  });

  return charts;
}

// Update a single chart with new data (helper function)
export function updateSingleChart(chart, config, legendId) {
  if (!chart || !config) return;
  
  // Update data
  config.datasets.forEach((dataset, datasetIndex) => {
    if (chart.data.datasets[datasetIndex]) {
      chart.data.datasets[datasetIndex].data = dataset.data.map(row => ({
        x: row.timestamp,
        y: row.count
      }));
    }
  });
  
  const xScale = chart.scales.x;
  if (!xScale) {
    chart.update('none');
    if (legendId) {
      createCustomLegend(chart, legendId);
    }
    return;
  }
  
  const dataLength = chart.data.datasets[0]?.data?.length || 0;
  if (dataLength === 0) {
    chart.update('none');
    if (legendId) {
      createCustomLegend(chart, legendId);
    }
    return;
  }
  
  const lastTimestamp = chart.data.datasets[0].data[dataLength - 1].x;
  const firstTimestamp = chart.data.datasets[0].data[0].x;
  
  // Calculate expected auto-scroll range
  let expectedMin, expectedMax;
  if (lastTimestamp - firstTimestamp >= SLIDING_WINDOW_SIZE) {
    expectedMin = lastTimestamp - SLIDING_WINDOW_SIZE;
    expectedMax = lastTimestamp;
  } else {
    expectedMin = undefined;
    expectedMax = undefined;
  }
  
  // Get current scale values
  const currentMin = xScale.options.min;
  const currentMax = xScale.options.max;
  
  // Check if user has manually zoomed/panned by comparing with expected auto-scroll values
  // Allow small tolerance for floating point differences
  const tolerance = 1000; // 1 second tolerance
  const minDiff = currentMin !== undefined && expectedMin !== undefined 
    ? Math.abs(currentMin - expectedMin) 
    : (currentMin !== expectedMin ? Infinity : 0);
  const maxDiff = currentMax !== undefined && expectedMax !== undefined 
    ? Math.abs(currentMax - expectedMax) 
    : (currentMax !== expectedMax ? Infinity : 0);
  
  const hasUserInteracted = minDiff > tolerance || maxDiff > tolerance;
  
  // If user hasn't interacted, auto-scroll to show latest data
  if (!hasUserInteracted) {
    if (expectedMin !== undefined && expectedMax !== undefined) {
      xScale.options.min = expectedMin;
      xScale.options.max = expectedMax;
    } else {
      // Not enough data yet, show all data
      xScale.options.min = undefined;
      xScale.options.max = undefined;
    }
  } else {
    // User has zoomed/panned - check if they're viewing near the latest data
    const currentMaxValue = xScale.max || lastTimestamp;
    const timeDiffFromLatest = lastTimestamp - currentMaxValue;
    
    // If user is viewing data within 10 seconds of the latest, resume auto-scroll
    if (timeDiffFromLatest < 10000 && expectedMin !== undefined && expectedMax !== undefined) {
      // Resume auto-scroll
      xScale.options.min = expectedMin;
      xScale.options.max = expectedMax;
    }
    // Otherwise, keep user's current zoom/pan position
  }
  
  // Update chart without animation for smooth real-time updates
  chart.update('none');
  
  // Update custom legend to reflect any visibility changes
  if (legendId) {
    createCustomLegend(chart, legendId);
  }
}

// Update all charts with new data
export function updateCharts(charts, dashboardConfigs) {
  // Update each chart
  dashboardConfigs.forEach((config, chartIndex) => {
    const chart = charts[chartIndex];
    updateSingleChart(chart, config, `legend-${config.id}`);
  });
}

