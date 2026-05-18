import React from 'react';
import styles from './Badge.module.css';

export const Badge = ({ children, status, className = '' }) => {
  return (
    <span className={`${styles.badge} ${styles[status] || styles.default} ${className}`}>
      {status && <span className={styles.dot} />}
      {children}
    </span>
  );
};
