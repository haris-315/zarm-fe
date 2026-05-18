import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import styles from './FindingCard.module.css';

export const FindingCard = ({ finding, onComment }) => {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState('0px');

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(expanded ? `${contentRef.current.scrollHeight}px` : '0px');
    }
  }, [expanded]);

  return (
    <div className={`${styles.card} ${expanded ? styles.expanded : ''}`}>
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <div className={styles.meta}>
          <Badge status={finding.type}>{finding.type}</Badge>
          {finding.department && <span className={styles.dept}>{finding.department}</span>}
          <div className={styles.dayPill}>Day {finding.day}</div>
        </div>
        <h4 className={styles.title}>{finding.title}</h4>
        <p className={styles.summary}>{finding.brief_summary}</p>
      </div>

      <div 
        className={styles.contentWrapper} 
        style={{ height: contentHeight }}
      >
        <div ref={contentRef} className={styles.content}>
          <div className={styles.section}>
            <label className={styles.label}>Description</label>
            <p className={styles.text}>{finding.description}</p>
          </div>
          {finding.data_source && (
            <div className={styles.section}>
              <label className={styles.label}>Data Source</label>
              <p className={styles.text}>{finding.data_source}</p>
            </div>
          )}
          {finding.internal_notes && (
            <div className={`${styles.section} ${styles.internal}`}>
              <label className={styles.label}>Internal Notes</label>
              <p className={styles.text}>{finding.internal_notes}</p>
            </div>
          )}

          <div className={styles.comments}>
            <label className={styles.label}>Discussion</label>
            <div className={styles.commentList}>
              {finding.comments?.map(c => (
                <div key={c.id} className={`${styles.comment} ${c.is_internal ? styles.commentInternal : ''}`}>
                  <div className={styles.commentAvatar}>
                    {c.user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className={styles.commentBody}>
                    <div className={styles.commentText}>{c.content}</div>
                    <div className={styles.commentMeta}>
                      {c.is_internal && <span className={styles.internalBadge}>Internal</span>}
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Comment input logic would go here, simplified for now */}
          </div>
        </div>
      </div>
    </div>
  );
};
