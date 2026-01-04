import React from 'react';

function SettingsPage() {
  return (
    <div style={{ padding: '40px' }}>
      <h1>Settings Page</h1>
      <p>This is the Settings page. You can add your settings content here.</p>
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Application Settings</h2>
        <p>Configure your application settings here.</p>
      </div>
    </div>
  );
}

export default SettingsPage;

