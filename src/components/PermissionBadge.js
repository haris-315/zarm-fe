import React from 'react';
import styles from './PermissionBadge.module.css';

const getCategory = (code) => {
  if (!code) return 'other';
  const prefix = code.split('.')[0].toLowerCase();
  const known = ['sprint', 'finding', 'decision', 'organization', 'report'];
  return known.includes(prefix) ? prefix : 'other';
};

export const PermissionBadge = ({ code, className = '' }) => {
  const cat = getCategory(code);
  return (
    <span className={`${styles.badge} ${styles[cat]} ${className}`}>
      <span className={styles.dot} />
      {code}
    </span>
  );
};

export const PermissionBadgeGroup = ({ codes = [], max }) => {
  const visible = max ? codes.slice(0, max) : codes;
  const overflow = max && codes.length > max ? codes.length - max : 0;

  return (
    <div className={styles.group}>
      {visible.map((code) => (
        <PermissionBadge key={code} code={code} />
      ))}
      {overflow > 0 && (
        <span className={`${styles.badge} ${styles.other}`}>+{overflow}</span>
      )}
    </div>
  );
};
