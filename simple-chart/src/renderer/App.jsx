import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import TabManager from './components/TabManager';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ManagementsPage from './pages/ManagementsPage';
import { SessionProvider } from './context/SessionContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <SessionProvider>
      <NotificationProvider>
        <HashRouter>
          <div className="app-container">
            <TabManager />
            <div className="page-content">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/managements" element={<ManagementsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </div>
        </HashRouter>
      </NotificationProvider>
    </SessionProvider>
  );
}

export default App;

