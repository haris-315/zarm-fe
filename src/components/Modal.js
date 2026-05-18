import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md' 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <div className={`${styles.overlay} ${isOpen ? styles.open : styles.closing}`} onAnimationEnd={() => !isOpen && setMounted(false)}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={`${styles.panel} ${styles[size]}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
