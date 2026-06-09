import React, { useState, useRef, useEffect } from 'react';
import styles from './TimePickerInput.module.css';

const ChevronUp = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="18 15 12 9 6 15" />
    </svg>
);

const ChevronDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export const TimePickerInput = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hours, setHours] = useState('09');
    const [minutes, setMinutes] = useState('00');
    const containerRef = useRef(null);

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            setHours(h || '09');
            setMinutes(m || '00');
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const changeHour = (delta) => {
        const h = ((parseInt(hours) + delta + 24) % 24);
        const padded = String(h).padStart(2, '0');
        setHours(padded);
        onChange(`${padded}:${minutes}`);
    };

    const changeMinute = (delta) => {
        const m = ((parseInt(minutes) + delta + 60) % 60);
        const padded = String(m).padStart(2, '0');
        setMinutes(padded);
        onChange(`${hours}:${padded}`);
    };

    const setQuick = (h, m) => {
        setHours(h);
        setMinutes(m);
        onChange(`${h}:${m}`);
    };

    const hasValue = !!value;

    return (
        <div className={styles.container} ref={containerRef}>
            {label && <label className={styles.label}>{label}</label>}

            <button
                type="button"
                className={styles.displayButton}
                onClick={() => setIsOpen(!isOpen)}
            >
                {hasValue
                    ? <span className={styles.displayTime}>{hours}:{minutes}</span>
                    : <span className={styles.placeholder}>--:--</span>
                }
                <span className={styles.icon}>⏱</span>
            </button>

            {isOpen && (
                <div className={styles.pickerDropdown}>
                    <div className={styles.spinnerRow}>
                        {/* Hours */}
                        <div className={styles.column}>
                            <span className={styles.columnLabel}>HH</span>
                            <button type="button" className={styles.spinBtn} onClick={() => changeHour(1)}>
                                <ChevronUp />
                            </button>
                            <div className={styles.valueDisplay}>{hours}</div>
                            <button type="button" className={styles.spinBtn} onClick={() => changeHour(-1)}>
                                <ChevronDown />
                            </button>
                        </div>

                        <div className={styles.separator}>:</div>

                        {/* Minutes */}
                        <div className={styles.column}>
                            <span className={styles.columnLabel}>MM</span>
                            <button type="button" className={styles.spinBtn} onClick={() => changeMinute(5)}>
                                <ChevronUp />
                            </button>
                            <div className={styles.valueDisplay}>{minutes}</div>
                            <button type="button" className={styles.spinBtn} onClick={() => changeMinute(-5)}>
                                <ChevronDown />
                            </button>
                        </div>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.quickButtons}>
                        <button type="button" className={styles.quickBtn} onClick={() => setQuick('09', '00')}>9:00 AM</button>
                        <button type="button" className={styles.quickBtn} onClick={() => setQuick('12', '00')}>12:00 PM</button>
                        <button type="button" className={styles.quickBtn} onClick={() => setQuick('14', '00')}>2:00 PM</button>
                        <button type="button" className={styles.quickBtn} onClick={() => setQuick('17', '00')}>5:00 PM</button>
                    </div>

                    <div className={styles.footer}>
                        <button type="button" className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
