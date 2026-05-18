import React from 'react';
import styles from './Skeleton.module.css';

export const Skeleton = ({ width, height, radius = 'md', className = '' }) => {
  return (
    <div 
      className={`${styles.skeleton} ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '20px',
        borderRadius: `var(--radius-${radius})`
      }}
    />
  );
};
