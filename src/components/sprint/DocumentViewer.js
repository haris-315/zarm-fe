import React, { useEffect, useState } from 'react';
import mammoth from 'mammoth/mammoth.browser';
import * as XLSX from 'xlsx';
import { sprintAPI } from '../../api/sprints';
import { Button } from '../Button';
import styles from './DocumentViewer.module.css';

export const DocumentViewer = ({ report, sprintId, onClose }) => {
  const [signedUrl, setSignedUrl] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mimeType = report.file_type || '';
  const isPdf = mimeType.includes('pdf');
  const isDocx = mimeType.includes('wordprocessingml') || mimeType.includes('msword') || mimeType.includes('docx') || mimeType.includes('doc');
  const isXlsx = mimeType.includes('spreadsheetml') || mimeType.includes('ms-excel') || mimeType.includes('xlsx') || mimeType.includes('xls');

  useEffect(() => {
    const load = async () => {
      try {
        const { url } = await sprintAPI.getReportUrl(sprintId, report.id);
        setSignedUrl(url);

        if (isPdf) { setLoading(false); return; }

        const token = localStorage.getItem('access_token');
        const proxyUrl = sprintAPI.getReportDownloadUrl(sprintId, report.id);
        const res = await fetch(proxyUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();

        if (isDocx) {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setContent(result.value);
        } else if (isXlsx) {
          const wb = XLSX.read(arrayBuffer, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          setContent(XLSX.utils.sheet_to_html(ws));
        } else {
          setError('Unsupported file type — please use the download button.');
        }
      } catch (e) {
        setError('Failed to load document.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [report.id, sprintId, isPdf, isDocx, isXlsx]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{report.title}</h3>
          <div className={styles.actions}>
            {signedUrl && (
              <a href={signedUrl} download={report.title}>
                <Button variant="secondary" size="sm">Download</Button>
              </a>
            )}
            <button className={styles.closeBtn} onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div className={styles.body}>
          {loading && <div className={styles.loading}>Loading document...</div>}
          {error && <div className={styles.error}>{error}</div>}
          {!loading && !error && isPdf && signedUrl && (
            <iframe src={signedUrl} title={report.title} className={styles.iframe} />
          )}
          {!loading && !error && (isDocx || isXlsx) && content && (
            <div className={styles.htmlContent} dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
      </div>
    </div>
  );
};
