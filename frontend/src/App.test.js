// Simple test to verify App renders
import React from 'react';

function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Test - App is Loading!</h1>
      <p>If you see this, React is working.</p>
      <p>Backend API: <a href="http://localhost:5000/api/health">http://localhost:5000/api/health</a></p>
    </div>
  );
}

export default SimpleApp;
