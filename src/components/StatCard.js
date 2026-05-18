import React, { useEffect, useState } from 'react';
import styles from './StatCard.module.css';

export const StatCard = ({ label, value, trend, trendValue }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (end === 0) return;
    
    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const current = Math.floor(progress * end);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className={styles.card}>
      <div className={styles.value}>{displayValue}</div>
      <div className={styles.label}>{label}</div>
      {trend && (
        <div className={`${styles.trend} ${styles[trend]}`}>
          {trendValue}
        </div>
      )}
    </div>
  );
};
