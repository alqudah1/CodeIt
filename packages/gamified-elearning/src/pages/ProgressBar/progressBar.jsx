// ProgressBar.js
import React from 'react';
import './progressBar.css';

const ProgressBar = ({ label, progress }) => {
  return (
    <div className="progress-container">
      <label>{label}</label>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default ProgressBar;