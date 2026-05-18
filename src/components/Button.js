import React from 'react';
import styles from './Button.module.css';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  loading = false, 
  icon: Icon,
  ...props 
}) => {
  return (
    <button 
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className} ${loading ? styles.loading : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className={styles.spinner} viewBox="0 0 24 24">
          <circle className={styles.path} cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
        </svg>
      )}
      {!loading && Icon && <Icon className={styles.icon} />}
      <span className={styles.content}>{children}</span>
    </button>
  );
};
