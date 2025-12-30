import React, { useEffect, useRef, useContext, useState } from 'react';
import { generateMockData } from '../js/mockData';
import { createCharts, updateCharts } from '../js/chartManager';
import { fetchSessionDashboardData } from '../js/sessionApi';
import { SessionContext } from '../context/SessionContext';

function DashboardPage() {
  const chartsRef = useRef([]);
  const intervalRef = useRef(null);
  const { selectedSessionId, sessionData, setSessionData } = useContext(SessionContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function setupCharts() {
      try {
        setIsLoading(true);
        setError(null);

        // Ưu tiên dùng data đã có trong context (được set từ ManagementsPage)
        let configs = sessionData;

        // Nếu chưa có thì mock gọi API với session mặc định
        if (!configs) {
          const fallbackSessionId = selectedSessionId || 'default';
          configs = await fetchSessionDashboardData(fallbackSessionId);
          if (!isMounted) return;
          setSessionData(configs);
        }

        // Tạo chart với data hiện tại
        const charts = createCharts(configs);
        chartsRef.current = charts;

        // Cập nhật realtime mỗi 1s bằng mock data
        intervalRef.current = setInterval(() => {
          const updatedConfigs = generateMockData(configs);
          updateCharts(chartsRef.current, updatedConfigs);
        }, 1000);
      } catch (e) {
        if (!isMounted) return;
        console.error('Failed to setup dashboard charts', e);
        setError('Không tải được dữ liệu dashboard (mock).');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    setupCharts();

    // Cleanup on unmount / khi đổi session
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
  }, [selectedSessionId, sessionData, setSessionData]);

  return (
    <div className="dashboard-container">
      {isLoading && (
        <div className="dashboard-panel">
          <h3>Đang tải dữ liệu dashboard...</h3>
        </div>
      )}
      {error && (
        <div className="dashboard-panel">
          <h3>{error}</h3>
        </div>
      )}
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

