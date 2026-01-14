import React, { createContext, useState, useCallback, useEffect } from 'react';

export const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearNotifications: () => {},
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(), // Unique ID
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info', // 'info', 'success', 'warning', 'error'
      timestamp: notification.timestamp || new Date().toLocaleString(),
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    return newNotification.id;
  }, []);

  // Remove a specific notification
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Listen for UDP messages and create notifications
  useEffect(() => {
    if (!window.electronAPI || !window.electronAPI.subscribeUdpData) {
      return;
    }

    // Notification types to listen for
    const notificationTypes = [
      'RECORDING_SESSION_STARTED',
      'RECORDING_SESSION_STOPPED',
      'SESSION_ERROR',
      'UDP_CONNECTION_ERROR',
      'DATA_RECEIVED',
      'SYSTEM_ALERT',
      'DETAIL_SESSION_STARTED',
      'DETAIL_SESSION_STOPPED'
    ];

    const handleUdpMessage = (udpPayload) => {
      try {
        console.log('NotificationProvider: ', udpPayload);
        const { msg } = udpPayload;
        let parsedData;

        try {
          parsedData = JSON.parse(msg);
        } catch (e) {
          // Not JSON, ignore
          return;
        }

        // Handle different message types and create notifications
        switch (parsedData.type) {
          case 'RECORDING_SESSION_STARTED':
            addNotification({
              title: 'Recording Started',
              message: `Session "${parsedData.data?.sessionName || parsedData.data?.sessionId}" has started recording`,
              type: 'success',
              timestamp: new Date().toLocaleString(),
            });
            break;

          case 'RECORDING_SESSION_STOPPED':
            addNotification({
              title: 'Recording Stopped',
              message: `Session "${parsedData.data?.sessionId}" stopped. Total records: ${parsedData.data?.totalRecords || 0}`,
              type: 'info',
              timestamp: new Date().toLocaleString(),
            });
            break;

          case 'SESSION_ERROR':
            addNotification({
              title: 'Session Error',
              message: parsedData.message || parsedData.error || 'An error occurred in the session',
              type: 'error',
              timestamp: new Date().toLocaleString(),
            });
            break;

          case 'UDP_CONNECTION_ERROR':
            addNotification({
              title: 'Connection Error',
              message: 'Failed to connect to UDP server',
              type: 'error',
              timestamp: new Date().toLocaleString(),
            });
            break;

          case 'DATA_RECEIVED':
            // Only notify for important data events
            if (parsedData.important) {
              addNotification({
                title: 'Data Received',
                message: parsedData.message || 'New data has been received',
                type: 'info',
                timestamp: new Date().toLocaleString(),
              });
            }
            break;

          case 'SYSTEM_ALERT':
            addNotification({
              title: parsedData.title || 'System Alert',
              message: parsedData.message || 'System notification',
              type: parsedData.alertType || 'warning',
              timestamp: new Date().toLocaleString(),
            });
            break;

          case 'DETAIL_SESSION_STARTED':
            addNotification({
              title: 'Detail Session Started',
              message: parsedData.message || 'Started receiving real-time data',
              type: 'success',
              timestamp: new Date().toLocaleString(),
            });
            break;

          case 'DETAIL_SESSION_STOPPED':
            addNotification({
              title: 'Detail Session Stopped',
              message: parsedData.message || 'Stopped receiving real-time data',
              type: 'info',
              timestamp: new Date().toLocaleString(),
            });
            break;

          default:
            // For other message types, you can add custom handling
            break;
        }
      } catch (error) {
        console.error('[NotificationContext] Error processing UDP message:', error);
      }
    };

    // Subscribe to each notification type
    const unsubscribeFunctions = notificationTypes.map(type => 
      window.electronAPI.subscribeUdpData(type, handleUdpMessage)
    );

    // Cleanup: unsubscribe from all types when component unmounts
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [addNotification]);

  // Listen for errors in the application
  useEffect(() => {
    const handleError = (event) => {
      addNotification({
        title: 'Application Error',
        message: event.message || 'An unexpected error occurred',
        type: 'error',
        timestamp: new Date().toLocaleString(),
      });
    };

    const handleUnhandledRejection = (event) => {
      addNotification({
        title: 'Unhandled Promise Rejection',
        message: event.reason?.message || 'A promise was rejected',
        type: 'error',
        timestamp: new Date().toLocaleString(),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
