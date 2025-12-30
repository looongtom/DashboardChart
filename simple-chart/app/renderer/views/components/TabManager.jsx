import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../style/tabManager.css';

const tabs = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/reports', label: 'Reports', icon: '📄' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

function TabManager() {
  const location = useLocation();
  const navigate = useNavigate();

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
    </div>
  );
}

export default TabManager;

