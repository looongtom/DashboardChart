import React from 'react';

function ReportsPage() {
  return (
    <div style={{ padding: '40px' }}>
      <h1>Reports Page</h1>
      <p>This is the Reports page. You can add your reports content here.</p>
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Report List</h2>
        <p>Your reports will be listed here.</p>
      </div>
    </div>
  );
}

export default ReportsPage;

