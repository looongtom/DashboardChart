import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import TabManager from './components/TabManager';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <HashRouter>
      <div className="app-container">
        <TabManager />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;

