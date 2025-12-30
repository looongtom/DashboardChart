import React, { useEffect, useRef, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateMockData } from '../js/mockData';
import { createCharts, updateCharts } from '../js/chartManager';
import { SessionContext } from '../context/SessionContext';
import '../style/dashboard.css';

function DashboardPage() {
  const navigate = useNavigate();
  const chartsRef = useRef([]);
  const intervalRef = useRef(null);
  const { selectedSessionId, selectedSessionName, sessionMessages } = useContext(SessionContext);
  
  const [selectedCharts, setSelectedCharts] = useState([]); // Array of { messageId } - mỗi message sẽ hiển thị tất cả data points trên cùng 1 chart
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

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

          // Update charts periodically if playing
          if (isPlaying) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            intervalRef.current = setInterval(() => {
              const updatedConfigs = generateMockData(configs);
              updateCharts(chartsRef.current, updatedConfigs);
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
    };
  }, [selectedCharts, sessionMessages, isPlaying, playbackSpeed]);

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

  const handleBack = () => {
    navigate('/managements');
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!sessionMessages || !selectedSessionName) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-empty">
          <p>Vui lòng chọn một phiên log từ trang Managements để xem chi tiết.</p>
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
            <h1 className="dashboard-session-title">{selectedSessionName}</h1>
            <p className="dashboard-subtitle">
              Chế độ Phân tích • {totalMessages} loại bản tin • {selectedCount}/4 đã chọn
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
                <div key={index} className="chart-panel">
                  {selection && message ? (
                    <>
                      <h3 className="chart-title">{message.name}</h3>
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
    </div>
  );
}

export default DashboardPage;
