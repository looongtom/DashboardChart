import React, { useState } from 'react';

function SettingsPage() {
  const [inputValue, setInputValue] = useState('');

  const handleSave = () => {
    // Handle save logic here
    console.log('Saving:', inputValue);
    alert(`Saved: ${inputValue}`);
  };

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
        
        <div style={{ marginTop: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            color: '#333'
          }}>
            Example Setting:
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a value..."
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              marginBottom: '15px'
            }}
          />
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

