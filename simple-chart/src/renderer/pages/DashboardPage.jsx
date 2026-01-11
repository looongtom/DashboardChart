import React, { useEffect, useRef, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateMockData } from '../js/mockData';
import { createCharts, updateCharts, updateSingleChart } from '../js/chartManager';
import { SessionContext } from '../context/SessionContext';
import { stopDetailSession, fetchSessionMessages, startDetailSession } from '../js/sessionApi';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import { timeScaleAdjustPlugin, verticalHoverLinePlugin } from '../js/plugins.js';
import { createCustomLegend } from '../js/legend.js';
import '../style/dashboard.css';

function DashboardPage() {
  const navigate = useNavigate();
  const chartsRef = useRef([]);
  const intervalRef = useRef(null);
  const configsRef = useRef([]); // Store current chart configs for UDP updates
  const { 
    selectedSessionId, 
    selectedSessionName, 
    sessionMessages,
    setSelectedSessionId,
    setSelectedSessionName,
    setSessionMessages,
    isRecording,
    activeSessionId,
    activeSessionName
  } = useContext(SessionContext);
  
  const [selectedCharts, setSelectedCharts] = useState([]); // Array of { messageId } - mỗi message sẽ hiển thị tất cả data points trên cùng 1 chart
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [chartsReady, setChartsReady] = useState(false); // Track when charts are created and ready
  const [fullScreenChartIndex, setFullScreenChartIndex] = useState(null); // Index of chart in full screen mode
  const fullScreenChartRef = useRef(null); // Reference to full screen chart instance
  const fullScreenChartIndexRef = useRef(null); // Ref to track full screen chart index for UDP updates

  // Auto-detect active recording session when Dashboard loads
  // Only auto-load if there's NO selected session (user navigated directly to Dashboard)
  // If user clicked "Xem chi tiết" on a session, respect that choice
  useEffect(() => {
    // Only auto-load active session if:
    // 1. There's an active recording session
    // 2. NO session is currently selected (user came directly to Dashboard)
    // 3. This ensures we don't override user's choice to view an old session
    if (isRecording && activeSessionId && !selectedSessionId) {
      const loadActiveSession = async () => {
        try {
          console.log('[Dashboard] Auto-loading active recording session:', activeSessionId);
          setSelectedSessionId(activeSessionId);
          setSelectedSessionName(activeSessionName || `Session_${activeSessionId}`);
          
          // For live sessions, we'll get messages from the active session
          // The messages should be available via UDP streaming
          // For now, we'll try to fetch them, but they might be empty initially
          try {
            const messages = await fetchSessionMessages(activeSessionId);
            if (messages && messages.length > 0) {
              setSessionMessages(messages);
            } else {
              // If no messages yet, we'll wait for UDP data
              // Set empty array for now, UDP listener will handle updates
              setSessionMessages([]);
            }
          } catch (err) {
            console.warn('[Dashboard] Could not fetch messages for active session, will use UDP stream:', err);
            setSessionMessages([]);
          }
          
          // Start live data streaming
          try {
            await startDetailSession();
          } catch (error) {
            console.error('[Dashboard] Error starting detail session:', error);
          }
        } catch (error) {
          console.error('[Dashboard] Error loading active session:', error);
        }
      };
      
      loadActiveSession();
    }
  }, [isRecording, activeSessionId, activeSessionName, selectedSessionId, setSelectedSessionId, setSelectedSessionName, setSessionMessages]);

  // Initialize charts when selections change
  useEffect(() => {
    if (selectedCharts.length === 0) {
      // Destroy all charts if no selection
      chartsRef.current.forEach(chart => {
        if (chart && chart.destroy) {
          chart.destroy();
        }
      });
      chartsRef.current = [];
      setChartsReady(false); // Mark charts as not ready
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setChartsReady(false); // Reset ready state when selections change

    let isMounted = true;

    function setupCharts() {
      try {
        // Wait for DOM to update
        setTimeout(() => {
          if (!isMounted) return;

          // Create dashboard configs from selected messages
          // Mỗi message sẽ có tất cả data points của nó trên cùng 1 chart
          const configs = selectedCharts.map((selection, index) => {
            const message = sessionMessages?.find(m => m.id === selection.messageId);
            
            if (!message) {
              return {
                id: `dashboard${index + 1}`,
                label: `Chart ${index + 1}`,
                datasets: []
              };
            }
            
            // Tạo datasets cho tất cả data points của message này
            const datasets = message.dataPoints.map((dataPoint, dpIndex) => ({
              label: dataPoint.label,
              dataPointId: dataPoint.id, // Store the data point ID for matching UDP data
              color: dataPoint.color,
              baseValue: 10 + (dpIndex * 5) + Math.random() * 10, // Khác nhau một chút để dễ phân biệt
              data: []
            }));
            
            return {
              id: `dashboard${index + 1}`,
              label: message.name, // Tên message làm title của chart
              datasets: datasets
            };
          });

          // Initialize data
          const now = Date.now();
          const thirtySecondsAgo = now - (30 * 1000);
          configs.forEach(config => {
            config.datasets.forEach(dataset => {
              for (let i = 0; i < 30; i++) {
                const timestamp = thirtySecondsAgo + (i * 1000);
                dataset.data.push({
                  timestamp: timestamp,
                  count: dataset.baseValue + Math.floor(Math.random() * 20)
                });
              }
            });
          });

          // Destroy old charts
          chartsRef.current.forEach(chart => {
            if (chart && chart.destroy) {
              chart.destroy();
            }
          });

          // Verify canvas elements exist before creating charts
          const allCanvasesExist = configs.every(config => {
            const element = document.getElementById(config.id);
            return element !== null;
          });

          if (!allCanvasesExist) {
            console.warn('Some canvas elements not found, retrying...');
            setTimeout(setupCharts, 100);
            return;
          }

          // Create new charts
          const charts = createCharts(configs);
          chartsRef.current = charts;
          configsRef.current = configs; // Store configs for UDP updates
          setChartsReady(true); // Mark charts as ready

          // Update charts periodically if playing (only if not receiving UDP data)
          if (isPlaying) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            intervalRef.current = setInterval(() => {
              const updatedConfigs = generateMockData(configsRef.current);
              configsRef.current = updatedConfigs;
              updateCharts(chartsRef.current, updatedConfigs);
              
              // Update full screen chart if it's open (use ref to get latest value)
              const currentFullScreenIndex = fullScreenChartIndexRef.current;
              if (currentFullScreenIndex && fullScreenChartRef.current) {
                const fullScreenConfig = configsRef.current[currentFullScreenIndex - 1];
                if (fullScreenConfig) {
                  updateSingleChart(fullScreenChartRef.current, fullScreenConfig, 'fullscreen-chart-legend');
                }
              }
            }, 1000 / playbackSpeed);
          }
        }, 50);
      } catch (e) {
        console.error('Failed to setup dashboard charts', e);
      }
    }

    setupCharts();

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      chartsRef.current.forEach(chart => {
        if (chart && chart.destroy) {
          chart.destroy();
        }
      });
      // Destroy full screen chart if it exists
      if (fullScreenChartRef.current) {
        if (fullScreenChartRef.current.destroy) {
          fullScreenChartRef.current.destroy();
        }
        fullScreenChartRef.current = null;
      }
    };
  }, [selectedCharts, sessionMessages, isPlaying, playbackSpeed]);

  // Listen for UDP data and update charts in real-time
  useEffect(() => {
    console.log('[UDP Listener] 🔍 useEffect triggered', {
      hasElectronAPI: !!window.electronAPI,
      hasOnUdpData: !!(window.electronAPI && window.electronAPI.onUdpData),
      selectedChartsCount: selectedCharts.length,
      chartsCount: chartsRef.current.length,
      chartsReady: chartsReady,
      sessionMessagesCount: sessionMessages?.length || 0
    });

    if (!window.electronAPI || !window.electronAPI.onUdpData) {
      console.warn('electronAPI.onUdpData not available');
      return;
    }

    if (selectedCharts.length === 0) {
      return;
    }

    // Wait for charts to be created (they're created asynchronously in setupCharts)
    if (!chartsReady || chartsRef.current.length === 0) {
      console.log('[UDP Listener] ⏳ Charts not ready yet, waiting...');
      return;
    }

    console.log('[UDP Listener] ✅ Setting up UDP listener...');

    const handleUdpData = (udpPayload) => {
      try {
        // UDP payload structure: { msg: string, sender: string, timestamp: number }
        const { msg, timestamp: udpTimestamp } = udpPayload;
        
        // Parse the message (expected to be JSON)
        let parsedData;
        try {
          parsedData = JSON.parse(msg);
        } catch (e) {
          console.warn('UDP message is not valid JSON:', msg);
          return;
        }

        // Skip HEARTBEAT_MESSAGES - they don't contain chart data
        if (parsedData.type === 'HEARTBEAT_MESSAGES') {
          // Heartbeat messages are handled separately via heartbeat-received event
          return;
        }

        // Use UDP timestamp or current time
        const dataTimestamp = udpTimestamp || Date.now();

        // Update each chart config with the new data
        const updatedConfigs = configsRef.current.map((config, chartIndex) => {
          // Find the message associated with this chart
          const selection = selectedCharts[chartIndex];
          if (!selection) return config;

          const message = sessionMessages?.find(m => m.id === selection.messageId);
          if (!message) return config;

          // Update datasets for this chart
          const updatedDatasets = config.datasets.map(dataset => {
            // Use the stored dataPointId to match the value in parsedData
            const dataPointId = dataset.dataPointId;
            if (!dataPointId) return dataset;

            // Extract value from parsed data using data point ID
            // Support multiple formats: direct property, nested object, or array
            let value = null;
            if (parsedData[dataPointId] !== undefined) {
              value = parsedData[dataPointId];
            } else if (parsedData.data && parsedData.data[dataPointId] !== undefined) {
              value = parsedData.data[dataPointId];
            } else if (Array.isArray(parsedData) && parsedData.length > 0) {
              // If data is an array, try to find by index or property
              const item = parsedData.find(item => item.id === dataPointId || item.label === dataset.label);
              if (item) {
                value = item.value !== undefined ? item.value : item[dataPointId];
              }
            }

            // If value is found, add it to the dataset
            if (value !== null && value !== undefined) {
              const newDataPoint = {
                timestamp: dataTimestamp,
                count: typeof value === 'number' ? value : parseFloat(value) || 0
              };

              // Add new data point
              const updatedData = [...dataset.data, newDataPoint];

              // Keep only last 5 minutes of data (sliding window)
              const fiveMinutesAgo = dataTimestamp - (5 * 60 * 1000);
              const filteredData = updatedData.filter(d => d.timestamp >= fiveMinutesAgo);

              return {
                ...dataset,
                data: filteredData
              };
            }

            return dataset;
          });

          return {
            ...config,
            datasets: updatedDatasets
          };
        });

        // Update stored configs
        configsRef.current = updatedConfigs;

        // Update charts with new data
        updateCharts(chartsRef.current, updatedConfigs);

        // Update full screen chart if it's open (use ref to get latest value)
        const currentFullScreenIndex = fullScreenChartIndexRef.current;
        if (currentFullScreenIndex && fullScreenChartRef.current) {
          const fullScreenConfig = configsRef.current[currentFullScreenIndex - 1];
          if (fullScreenConfig) {
            console.log('[UDP] Updating full screen chart with new data', {
              index: currentFullScreenIndex,
              config: fullScreenConfig
            });
            updateSingleChart(fullScreenChartRef.current, fullScreenConfig, 'fullscreen-chart-legend');
          }
        }

        console.log('Updated charts with UDP data:', parsedData);
      } catch (error) {
        console.error('Error processing UDP data:', error);
      }
    };

    // Register UDP listener
    console.log('[UDP Listener] 🔌 Registering UDP data handler...');
    window.electronAPI.onUdpData(handleUdpData);
    console.log('[UDP Listener] ✅ UDP listener registered successfully');

    // Cleanup: remove listener when component unmounts or dependencies change
    return () => {
      if (window.electronAPI && window.electronAPI.removeUdpListener) {
        window.electronAPI.removeUdpListener();
      }
    };
  }, [selectedCharts, sessionMessages, chartsReady]);

  const handleSelectMessage = (messageId) => {
    // Check if message is already selected
    const existingIndex = selectedCharts.findIndex(s => s.messageId === messageId);

    if (existingIndex >= 0) {
      // Deselect - remove message
      const newCharts = selectedCharts.filter((_, i) => i !== existingIndex);
      setSelectedCharts(newCharts);
    } else {
      // Check if max 4 charts reached
      if (selectedCharts.length >= 4) {
        alert('Chỉ có thể chọn tối đa 4 biểu đồ');
        return;
      }
      // Select - add message (tất cả data points sẽ hiển thị trên cùng 1 chart)
      setSelectedCharts([...selectedCharts, { messageId }]);
    }
  };

  const isMessageSelected = (messageId) => {
    return selectedCharts.some(s => s.messageId === messageId);
  };

  const handleBack = async () => {
    // Stop payload message streaming before navigating away
    try {
      await stopDetailSession();
    } catch (error) {
      console.error('Error stopping detail session:', error);
      // Don't block navigation if this fails
    }
    navigate('/managements');
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleChartClick = (index) => {
    const selection = selectedCharts[index - 1];
    if (selection) {
      setFullScreenChartIndex(index);
      fullScreenChartIndexRef.current = index; // Update ref immediately
    }
  };

  const handleCloseFullScreen = () => {
    // Destroy full screen chart
    if (fullScreenChartRef.current) {
      if (fullScreenChartRef.current.destroy) {
        fullScreenChartRef.current.destroy();
      }
      fullScreenChartRef.current = null;
    }
    setFullScreenChartIndex(null);
    fullScreenChartIndexRef.current = null; // Clear ref
  };

  const createFullScreenChart = (index) => {
    const selection = selectedCharts[index - 1];
    if (!selection) return;

    const message = sessionMessages?.find(m => m.id === selection.messageId);
    if (!message) return;

    // Destroy existing full screen chart if any
    if (fullScreenChartRef.current) {
      if (fullScreenChartRef.current.destroy) {
        fullScreenChartRef.current.destroy();
      }
    }

    // Find the config for this chart
    const config = configsRef.current[index - 1];
    if (!config) return;

    // Create full screen chart
    const fullScreenCanvas = document.getElementById('fullscreen-chart-canvas');
    if (!fullScreenCanvas) return;

    const fullScreenChart = new Chart(
      fullScreenCanvas,
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
            duration: 0
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
                maxTicksLimit: 20,
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
              display: false
            },
            tooltip: {
              intersect: false,
              mode: 'index'
            },
            zoom: {
              pan: {
                enabled: true,
                mode: 'x',
                modifierKey: null,
                threshold: 10
              },
              zoom: {
                wheel: {
                  enabled: true,
                  modifierKey: 'ctrl',
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

    // Create custom legend for full screen chart
    createCustomLegend(fullScreenChart, 'fullscreen-chart-legend');
    
    fullScreenChartRef.current = fullScreenChart;

    // Store the index for updating
    fullScreenChartRef.current.fullScreenIndex = index;
  };

  // Update ref whenever fullScreenChartIndex changes (for UDP updates)
  useEffect(() => {
    fullScreenChartIndexRef.current = fullScreenChartIndex;
  }, [fullScreenChartIndex]);

  // Create full screen chart when both index and charts are ready
  useEffect(() => {
    if (fullScreenChartIndex && chartsReady) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        createFullScreenChart(fullScreenChartIndex);
      }, 100);
    }
  }, [fullScreenChartIndex, chartsReady]);

  // Close full screen if the chart is no longer selected
  useEffect(() => {
    if (fullScreenChartIndex) {
      const selection = selectedCharts[fullScreenChartIndex - 1];
      if (!selection) {
        handleCloseFullScreen();
      }
    }
  }, [selectedCharts, fullScreenChartIndex]);

  // Show empty state only if there's no selected session
  // Don't auto-show active session - only show if user explicitly selected it or navigated directly
  if (!sessionMessages || !selectedSessionName) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-empty">
          <p>Vui lòng chọn một phiên log từ trang Managements để xem chi tiết.</p>
          {isRecording && activeSessionId && !selectedSessionId && (
            <p style={{ marginTop: '12px', color: '#4caf50', fontWeight: '500' }}>
              Đang tải phiên đang chạy...
            </p>
          )}
          <button onClick={handleBack} className="back-button">← Quay lại</button>
        </div>
      </div>
    );
  }

  const selectedCount = selectedCharts.length;
  const totalMessages = sessionMessages.length;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <button onClick={handleBack} className="back-button">←</button>
          <div className="dashboard-title-section">
            <h1 className="dashboard-session-title">
              {selectedSessionName}
              {isRecording && selectedSessionId === activeSessionId && (
                <span style={{ 
                  marginLeft: '12px', 
                  fontSize: '14px', 
                  color: '#4caf50',
                  fontWeight: 'normal'
                }}>
                  (Đang chạy)
                </span>
              )}
              {isRecording && selectedSessionId !== activeSessionId && (
                <span style={{ 
                  marginLeft: '12px', 
                  fontSize: '12px', 
                  color: '#999',
                  fontWeight: 'normal',
                  fontStyle: 'italic'
                }}>
                  (Đang xem lịch sử - Ghi log vẫn tiếp tục)
                </span>
              )}
            </h1>
            <p className="dashboard-subtitle">
              {isRecording && selectedSessionId === activeSessionId ? 'Chế độ Realtime' : 'Chế độ Phân tích'} • {totalMessages} loại bản tin • {selectedCount}/4 đã chọn
            </p>
          </div>
        </div>
        <div className="dashboard-header-right">
          <div className="playback-controls">
            <button onClick={handlePlayPause} className="playback-button">
              {isPlaying ? '⏸' : '▶'}
            </button>
            <span className="playback-speed">Tốc độ: {playbackSpeed}x</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Messages List */}
        <div className="dashboard-messages-section">
          <h2 className="messages-title">Danh sách Bản tin trong Phiên</h2>
          <p className="messages-subtitle">Chọn tối đa 4 bản tin để hiển thị trên biểu đồ</p>
          <div className="messages-counter">{selectedCount}/4 đã chọn</div>
          
          <div className="messages-list">
            {sessionMessages.map((message) => (
              <div key={message.id} className="message-card">
                <div className="message-header">
                  <span className="message-dot" style={{ backgroundColor: message.color }}></span>
                  <div className="message-info">
                    <h3 className="message-name">{message.name}</h3>
                    <p className="message-description">{message.description}</p>
                    <div className="message-meta">
                      <span>Tần suất: {message.frequency}</span>
                      <span>Số bản ghi: {message.recordCount.toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
                <div className="message-data-points">
                  {message.dataPoints.map((dataPoint) => (
                    <span
                      key={dataPoint.id}
                      className="data-point-label"
                      style={{ 
                        color: isMessageSelected(message.id) ? dataPoint.color : '#666',
                        fontWeight: isMessageSelected(message.id) ? '500' : '400'
                      }}
                    >
                      {dataPoint.label}
                    </span>
                  ))}
                </div>
                <button
                  className={`select-message-button ${isMessageSelected(message.id) ? 'selected' : ''}`}
                  onClick={() => handleSelectMessage(message.id)}
                >
                  {isMessageSelected(message.id) ? '✓ Đã chọn' : '+ Chọn'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="dashboard-charts-section">
          <div className="charts-grid">
            {[1, 2, 3, 4].map((index) => {
              const selection = selectedCharts[index - 1];
              const message = selection ? sessionMessages.find(m => m.id === selection.messageId) : null;
              
              return (
                <div 
                  key={index} 
                  className="chart-panel"
                >
                  {selection && message ? (
                    <>
                      <div className="chart-header">
                        <h3 className="chart-title">{message.name}</h3>
                        <button
                          className="fullscreen-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChartClick(index);
                          }}
                          title="Xem full screen"
                        >
                          ⛶
                        </button>
                      </div>
                      <div id={`legend-dashboard${index}`} className="custom-legend"></div>
                      <canvas id={`dashboard${index}`} style={{ maxHeight: '350px' }}></canvas>
                    </>
                  ) : (
                    <div className="chart-placeholder">
                      <div className="placeholder-icon">📊</div>
                      <p className="placeholder-text">Biểu đồ {index}</p>
                      <p className="placeholder-hint">Chọn bản tin bên dưới</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Screen Modal */}
      {fullScreenChartIndex && (
        <div className="fullscreen-modal" onClick={handleCloseFullScreen}>
          <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-header">
              <h2 className="fullscreen-title">
                {selectedCharts[fullScreenChartIndex - 1] && 
                 sessionMessages?.find(m => m.id === selectedCharts[fullScreenChartIndex - 1].messageId)?.name}
              </h2>
              <button className="fullscreen-close-button" onClick={handleCloseFullScreen}>
                ✕
              </button>
            </div>
            <div id="fullscreen-chart-legend" className="custom-legend"></div>
            <div className="fullscreen-chart-container">
              <canvas id="fullscreen-chart-canvas"></canvas>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
