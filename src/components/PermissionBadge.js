import React from 'react';
import styles from './PermissionBadge.module.css';

const getCategory = (code) => {
  const str = typeof code === 'string' ? code : code?.code || code?.name || '';
  if (!str) return 'other';
  const prefix = str.split('.')[0].toLowerCase();
  const known = ['sprint', 'finding', 'decision', 'organization', 'report'];
  return known.includes(prefix) ? prefix : 'other';
};

const normalize = (code) =>
  typeof code === 'string' ? code : code?.code || code?.name || '';

export const PermissionBadge = ({ code, className = '' }) => {
  const label = normalize(code);
  const cat = getCategory(label);
  return (
    <span className={`${styles.badge} ${styles[cat]} ${className}`}>
      <span className={styles.dot} />
      {label}
    </span>
  );
};

export const PermissionBadgeGroup = ({ codes = [], max }) => {
  const normalized = codes.map(normalize).filter(Boolean);
  const visible = max ? normalized.slice(0, max) : normalized;
  const overflow = max && normalized.length > max ? normalized.length - max : 0;

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
