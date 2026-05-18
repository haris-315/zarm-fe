import React from 'react';
import styles from './MetricsBar.module.css';

export const MetricsBar = ({ totalFindings, totalDecisions, aiScore }) => {
  return (
    <div className={styles.container}>
      <div className={styles.metricCard}>
        <div className={styles.value}>{totalFindings}</div>
        <div className={styles.label}>Total Findings</div>
      </div>
      <div className={styles.metricCard}>
        <div className={styles.value}>{totalDecisions}</div>
        <div className={styles.label}>Decision Cards</div>
      </div>
      <div className={styles.scoreCard}>
        <div className={styles.scoreWrapper}>
          <svg className={styles.svg} viewBox="0 0 100 100">
            <circle className={styles.track} cx="50" cy="50" r="45" />
            <circle 
              className={styles.indicator} 
              cx="50" 
              cy="50" 
              r="45" 
              style={{ strokeDasharray: `${(aiScore / 100) * 283} 283` }}
            />
          </svg>
          <div className={styles.scoreValue}>{aiScore}</div>
        </div>
        <div className={styles.label}>AI Readiness Score</div>
      </div>
    </div>
  );
};
