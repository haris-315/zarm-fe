import React from 'react';
import styles from './DayProgress.module.css';

const DAY_LABELS = ['Discovery', 'Analysis', 'Scoring', 'Strategy', 'Delivery'];

export const DayProgress = ({ currentDay }) => {
  return (
    <div className={styles.container}>
      {DAY_LABELS.map((label, i) => {
        const day = i + 1;
        const isDone = day < currentDay;
        const isCurrent = day === currentDay;
        
        return (
          <React.Fragment key={day}>
            <div className={`${styles.pill} ${isDone ? styles.done : ''} ${isCurrent ? styles.current : ''}`}>
              <div className={styles.dayNum}>Day {day}</div>
              <div className={styles.dayLabel}>{label}</div>
              {isCurrent && <div className={styles.pulse} />}
            </div>
            {i < DAY_LABELS.length - 1 && <div className={styles.line} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};
