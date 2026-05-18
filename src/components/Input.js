import React from 'react';
import styles from './Input.module.css';

export const Input = ({ label, error, className = '', type = 'text', ...props }) => {
  const isTextarea = type === 'textarea';
  const Component = isTextarea ? 'textarea' : 'input';

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <Component 
        className={`${styles.input} ${error ? styles.hasError : ''}`}
        type={isTextarea ? undefined : type}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export const Select = ({ label, error, className = '', options = [], ...props }) => {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.selectWrapper}>
        <select 
          className={`${styles.input} ${styles.select} ${error ? styles.hasError : ''}`}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className={styles.chevron}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
