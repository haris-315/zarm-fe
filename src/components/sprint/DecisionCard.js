import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import styles from './DecisionCard.module.css';

export const DecisionCard = ({ card, onPublish }) => {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState('0px');

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(expanded ? `${contentRef.current.scrollHeight}px` : '0px');
    }
  }, [expanded]);

  const priorityColors = {
    'Quick Win': 'complete',
    'Strategic': 'in_progress',
    'Technical Debt': 'suspended',
    'Backlog': 'planning'
  };

  return (
    <div className={`${styles.card} ${expanded ? styles.expanded : ''} ${card.published_to_client ? styles.published : ''}`}>
      {card.published_to_client && <div className={styles.publishedBadge}>Published</div>}
      
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <div className={styles.meta}>
          <Badge status={priorityColors[card.priority_tier]}>{card.priority_tier}</Badge>
          <div className={styles.scores}>
            <div className={styles.scorePill}>Effort {card.effort}</div>
            <div className={styles.scorePill}>Impact {card.impact}</div>
          </div>
        </div>
        <h4 className={styles.title}>{card.title}</h4>
        <p className={styles.summary}>{card.problem}</p>
      </div>

      <div 
        className={styles.contentWrapper} 
        style={{ height: contentHeight }}
      >
        <div ref={contentRef} className={styles.content}>
          <div className={styles.section}>
            <label className={styles.label}>Solution</label>
            <p className={styles.text}>{card.solution}</p>
          </div>
          <div className={styles.section}>
            <label className={styles.label}>Expected Outcome</label>
            <p className={styles.text}>{card.expected_outcome}</p>
          </div>

          {!card.published_to_client && (
            <div className={styles.footer}>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onPublish?.(); }}>
                Publish to Client
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
