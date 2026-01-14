/**
 * Notification Helper
 * 
 * This file provides examples and utilities for using the notification system
 * throughout the application.
 * 
 * The notification system automatically listens for UDP messages and creates
 * notifications for various events. You can also manually add notifications
 * from any component using the NotificationContext.
 */

/**
 * Example: Adding a notification from a component
 * 
 * import { useContext } from 'react';
 * import { NotificationContext } from '../context/NotificationContext';
 * 
 * function MyComponent() {
 *   const { addNotification } = useContext(NotificationContext);
 * 
 *   const handleSomething = () => {
 *     // Add a success notification
 *     addNotification({
 *       title: 'Success!',
 *       message: 'Operation completed successfully',
 *       type: 'success',
 *     });
 * 
 *     // Add an error notification
 *     addNotification({
 *       title: 'Error',
 *       message: 'Something went wrong',
 *       type: 'error',
 *     });
 * 
 *     // Add a warning notification
 *     addNotification({
 *       title: 'Warning',
 *       message: 'Please check your settings',
 *       type: 'warning',
 *     });
 * 
 *     // Add an info notification with custom duration
 *     addNotification({
 *       title: 'Info',
 *       message: 'This is an informational message',
 *       type: 'info',
 *       duration: 5000, // 5 seconds
 *     });
 * 
 *     // Add a notification that doesn't auto-remove
 *     addNotification({
 *       title: 'Important',
 *       message: 'This notification stays until manually closed',
 *       type: 'warning',
 *       autoRemove: false,
 *     });
 *   };
 * 
 *   return <button onClick={handleSomething}>Do Something</button>;
 * }
 */

/**
 * Notification Types:
 * - 'info' (default): Blue border, informational messages
 * - 'success': Green border, success messages
 * - 'warning': Orange border, warning messages
 * - 'error': Red border, error messages
 * 
 * Notification Properties:
 * - title (string, required): The notification title
 * - message (string, optional): Additional message/details
 * - type (string, optional): 'info' | 'success' | 'warning' | 'error'
 * - timestamp (string/Date, optional): Custom timestamp (defaults to current time)
 * - autoRemove (boolean, optional): Whether to auto-remove after duration (default: true)
 * - duration (number, optional): Auto-remove duration in milliseconds (default: 10000)
 */

/**
 * Automatic Notifications:
 * 
 * The NotificationContext automatically creates notifications for:
 * 
 * 1. RECORDING_SESSION_STARTED - When a recording session starts
 * 2. RECORDING_SESSION_STOPPED - When a recording session stops
 * 3. SESSION_ERROR - When a session error occurs
 * 4. UDP_CONNECTION_ERROR - When UDP connection fails
 * 5. DATA_RECEIVED - When important data is received (if marked as important)
 * 6. SYSTEM_ALERT - System alerts from the backend
 * 7. Application errors - Unhandled errors and promise rejections
 */

/**
 * Example: Adding custom notification types from sessionApi
 * 
 * In sessionApi.js, you could add notifications like this:
 * 
 * import { addNotification } from './notificationHelper'; // If exported
 * 
 * // Or better, pass addNotification as a callback or use context
 * 
 * // Example: Notify on session fetch error
 * try {
 *   const sessions = await fetchSessions();
 * } catch (error) {
 *   // Notification will be handled by NotificationContext automatically
 *   // Or you can manually add:
 *   addNotification({
 *     title: 'Failed to Load Sessions',
 *     message: error.message,
 *     type: 'error',
 *   });
 * }
 */

export default {
  // This file is for documentation purposes
  // The actual notification functionality is in NotificationContext.jsx
};
