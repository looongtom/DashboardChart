import React, { useContext, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../style/tabManager.css';
import { SessionContext } from '../context/SessionContext';
import { NotificationContext } from '../context/NotificationContext';

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
  const { notifications, clearNotifications, removeNotification } = useContext(NotificationContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleClearNotifications = () => {
    clearNotifications();
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp; // Return as-is if not a valid date
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

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
      <div className="tab-manager-right">
        {isRecording && (
          <div className="recording-status-indicator" title="Đang ghi log - Hệ thống đang ghi dữ liệu ngầm">
            Đang nhận log
            <span className="recording-indicator"></span>
          </div>
        )}
        <div className="notification-wrapper" ref={notificationRef}>
          <button
            className="notification-icon-button"
            onClick={toggleNotifications}
            title="Notifications"
          >
            <span className="notification-icon">🔔</span>
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    className="clear-notifications-button"
                    onClick={handleClearNotifications}
                    title="Clear all notifications"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">No notifications</div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`notification-item notification-${notification.type || 'info'}`}
                    >
                      <div className="notification-content">
                        <div className="notification-header-item">
                          <div className="notification-title">{notification.title}</div>
                          <button
                            className="notification-close-button"
                            onClick={() => removeNotification(notification.id)}
                            title="Close notification"
                          >
                            ×
                          </button>
                        </div>
                        {notification.message && (
                          <div className="notification-message">{notification.message}</div>
                        )}
                        {notification.timestamp && (
                          <div className="notification-timestamp">
                            {formatTimestamp(notification.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TabManager;

