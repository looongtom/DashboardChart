import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../style/tabManager.css';
import { SessionContext } from '../context/SessionContext';

const tabs = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/managements', label: 'Managements', icon: '📋' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

function TabManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isRecording } = useContext(SessionContext);

  return (
    <div className="tab-manager">
      <div className="tab-container">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              className={`tab-button ${isActive ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
      {isRecording && (
        <div className="recording-status-indicator" title="Đang ghi log - Hệ thống đang ghi dữ liệu ngầm">
          Đang nhận log
          <span className="recording-indicator"></span>
        </div>
      )}
    </div>
  );
}

export default TabManager;

