// ProgressBar.js
import React from 'react';
import './progressBar.css';

const ProgressBar = ({ currentStep }) => {
  // currentStep can be: 'lesson', 'quiz', or 'puzzle'
  const steps = [
    { id: 'lesson', label: 'Lesson', icon: '📚' },
    { id: 'quiz', label: 'Quiz', icon: '📝' },
    { id: 'puzzle', label: 'Puzzle', icon: '🧩' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="learning-progress-container">
      <div className="progress-steps">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              <div className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isUpcoming ? 'upcoming' : ''}`}>
                <div className="step-circle">
                  {isCompleted ? (
                    <span className="check-icon">✓</span>
                  ) : (
                    <span className="step-icon">{step.icon}</span>
                  )}
                </div>
                <div className="step-label">{step.label}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`progress-connector ${isCompleted ? 'completed' : ''}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;