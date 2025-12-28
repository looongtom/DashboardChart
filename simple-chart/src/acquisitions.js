import Chart from 'chart.js/auto'
import 'chartjs-adapter-date-fns'
import zoomPlugin from 'chartjs-plugin-zoom'

(async function() {
  // Initialize data with timestamps (starting from 30 seconds ago)
  const now = Date.now();
  const thirtySecondsAgo = now - (30 * 1000);
  const interval = 1000; // 1 second between data points
  
  // Configuration for 4 dashboards
  const dashboardConfigs = [
    {
      id: 'dashboard1',
      label: 'Dashboard 1',
      datasets: [
        {
          label: 'Metric A',
          color: 'rgb(75, 192, 192)',
          baseValue: 10,
          data: []
        },
        {
          label: 'Metric B',
          color: 'rgb(255, 99, 132)',
          baseValue: 20,
          data: []
        }
      ]
    },
    {
      id: 'dashboard2',
      label: 'Dashboard 2',
      datasets: [
        {
          label: 'Metric C',
          color: 'rgb(255, 205, 86)',
          baseValue: 15,
          data: []
        },
        {
          label: 'Metric D',
          color: 'rgb(54, 162, 235)',
          baseValue: 25,
          data: []
        }
      ]
    },
    {
      id: 'dashboard3',
      label: 'Dashboard 3',
      datasets: [
        {
          label: 'Metric E',
          color: 'rgb(153, 102, 255)',
          baseValue: 18,
          data: []
        },
        {
          label: 'Metric F',
          color: 'rgb(255, 159, 64)',
          baseValue: 22,
          data: []
        }
      ]
    },
    {
      id: 'dashboard4',
      label: 'Dashboard 4',
      datasets: [
        {
          label: 'Metric G',
          color: 'rgb(201, 203, 207)',
          baseValue: 12,
          data: []
        },
        {
          label: 'Metric H',
          color: 'rgb(255, 99, 255)',
          baseValue: 28,
          data: []
        }
      ]
    }
  ];

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

  // Create chart instances for each dashboard
  const charts = dashboardConfigs.map(config => {
    return new Chart(
      document.getElementById(config.id),
      {
        type: 'line',
        plugins: [zoomPlugin],
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
                  second: 'HH:mm:ss'
                },
                tooltipFormat: 'HH:mm:ss'
              },
              title: {
                display: true,
                text: 'Time'
              },
              ticks: {
                source: 'data',
                maxRotation: 0,
                autoSkip: true
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
              display: true,
              position: 'top'
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
  });

  // Add double-click event listener to reset zoom for each chart
  charts.forEach((chart, index) => {
    const canvas = chart.canvas;
    canvas.addEventListener('dblclick', (e) => {
      e.preventDefault();
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

  // Function to generate mock data - adds new point every second for each dataset
  function generateMockData() {
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

  // Update all charts with new data
  function updateCharts() {
    const updatedConfigs = generateMockData();
    
    // Update each chart
    updatedConfigs.forEach((config, chartIndex) => {
      const chart = charts[chartIndex];
      config.datasets.forEach((dataset, datasetIndex) => {
        chart.data.datasets[datasetIndex].data = dataset.data.map(row => ({
          x: row.timestamp,
          y: row.count
        }));
      });
      
      // Update chart without animation for smooth real-time updates
      chart.update('none');
    });
  }

  // Update charts every second (1000ms) for real-time visualization
  setInterval(updateCharts, 1000);
})();
