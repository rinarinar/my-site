'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../styles/LifeProgress.module.css';

const LS_BIRTH = 'lifeProgress:birth';
const LS_SPAN = 'lifeProgress:lifespanYears';
const LS_UPDATED = 'lifeProgress:lastSaved';
const DEFAULT_BIRTH = '1999-11-20';

function addYears(date, years) {
  const d = new Date(date.getTime());
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function formatDateDot(d) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function useLifeClock(birth, end) {
  const [, bump] = useState(0);

  useEffect(() => {
    const id = setInterval(() => bump((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const birthMs = birth.getTime();
  const endMs = end.getTime();
  const now = Date.now();
  const totalMs = endMs - birthMs;
  const passedMs = Math.max(0, now - birthMs);
  const remainingMs = Math.max(0, endMs - now);

  const passedDays = Math.floor(passedMs / 86400000);
  const remainingWholeDays = Math.floor(remainingMs / 86400000);

  const totalSec = Math.floor(remainingMs / 1000);
  const cdD = Math.floor(totalSec / 86400);
  const secRem = totalSec % 86400;
  const cdH = Math.floor(secRem / 3600);
  const cdM = Math.floor((secRem % 3600) / 60);
  const cdS = secRem % 60;

  const pct = totalMs > 0 ? Math.min(100, Math.max(0, (passedMs / totalMs) * 100)) : 0;

  const weekMs = 7 * 86400000;
  const totalWeeks = Math.max(1, Math.ceil(totalMs / weekMs));
  let currentWeekIndex = Math.floor(passedMs / weekMs);
  if (currentWeekIndex >= totalWeeks) currentWeekIndex = totalWeeks - 1;
  if (currentWeekIndex < 0) currentWeekIndex = 0;

  return {
    passedDays,
    remainingBig: remainingWholeDays,
    countdown: {
      d: cdD,
      h: String(cdH).padStart(2, '0'),
      m: String(cdM).padStart(2, '0'),
      s: String(cdS).padStart(2, '0'),
    },
    pct,
    totalWeeks,
    currentWeekIndex,
    birthDot: formatDateDot(birth),
    endDot: formatDateDot(end),
  };
}

export default function LifeProgress() {
  const [birthStr, setBirthStr] = useState(DEFAULT_BIRTH);
  const [lifespanYears, setLifespanYears] = useState(100);
  const [draftBirth, setDraftBirth] = useState(DEFAULT_BIRTH);
  const [draftSpan, setDraftSpan] = useState(100);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const b = localStorage.getItem(LS_BIRTH);
    const s = localStorage.getItem(LS_SPAN);
    const u = localStorage.getItem(LS_UPDATED);
    if (b) {
      setBirthStr(b);
      setDraftBirth(b);
    }
    if (s) {
      const n = parseInt(s, 10);
      if (!Number.isNaN(n) && n > 0 && n <= 130) {
        setLifespanYears(n);
        setDraftSpan(n);
      }
    }
    if (u) setLastSaved(parseInt(u, 10));
  }, []);

  const birth = new Date(birthStr + 'T12:00:00');
  const end = addYears(birth, lifespanYears);
  const clock = useLifeClock(birth, end);

  const saveSettings = useCallback(() => {
    const span = Math.min(130, Math.max(1, Math.round(Number(draftSpan)) || 1));
    setDraftSpan(span);
    setLifespanYears(span);
    const b = draftBirth || DEFAULT_BIRTH;
    setBirthStr(b);
    setDraftBirth(b);
    const t = Date.now();
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_BIRTH, b);
      localStorage.setItem(LS_SPAN, String(span));
      localStorage.setItem(LS_UPDATED, String(t));
    }
    setLastSaved(t);
  }, [draftBirth, draftSpan]);

  const updatedLabel = lastSaved
    ? new Date(lastSaved)
    : null;

  const weeks = [];
  for (let i = 0; i < clock.totalWeeks; i++) {
    weeks.push(i);
  }
  const cols = 52;
  const rows = Math.ceil(clock.totalWeeks / cols);

  return (
    <div className={styles.wrap}>
      <div className={styles.config}>
        <label className={styles.configLabel}>
          出生日期
          <input
            type="date"
            className={styles.configInput}
            value={draftBirth}
            onChange={(e) => setDraftBirth(e.target.value)}
          />
        </label>
        <label className={styles.configLabel}>
          预期寿命（岁）
          <input
            type="number"
            className={styles.configInput}
            min={1}
            max={130}
            value={draftSpan}
            onChange={(e) => setDraftSpan(e.target.value)}
          />
        </label>
        <button type="button" className={styles.saveBtn} onClick={saveSettings}>
          保存
        </button>
      </div>

      <blockquote className={styles.quote}>
        stay away from unnecessary pain. Be yourself
      </blockquote>
      {updatedLabel && (
        <p className={styles.updated}>
          — {updatedLabel.getFullYear()} / {updatedLabel.getMonth() + 1} / {updatedLabel.getDate()} 更新
        </p>
      )}

      <div className={styles.stats}>
        <div className={styles.statBlock}>
          <div className={styles.statLabel}>已度过</div>
          <div className={styles.statNum}>{clock.passedDays.toLocaleString('en-US')}</div>
          <div className={styles.statUnit}>天</div>
        </div>
        <div className={styles.statBlock}>
          <div className={styles.statLabel}>剩余</div>
          <div className={styles.statNum}>{clock.remainingBig.toLocaleString('en-US')}</div>
          <div className={styles.countdown}>
            {clock.countdown.d}天 {clock.countdown.h}:{clock.countdown.m}:{clock.countdown.s}
          </div>
        </div>
      </div>

      <div className={styles.barArea}>
        <div className={styles.barDates}>
          <span>{clock.birthDot}</span>
          <span>{clock.endDot}</span>
        </div>
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${clock.pct}%` }} />
        </div>
        <div className={styles.pct}>{clock.pct.toFixed(1)}%</div>
      </div>

      <p className={styles.gridCaption}>每个方块 = 1 周</p>
      <div
        className={styles.weekGrid}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
        }}
      >
        {weeks.map((i) => {
          let cls = styles.weekFuture;
          if (i < clock.currentWeekIndex) cls = styles.weekPassed;
          else if (i === clock.currentWeekIndex) cls = styles.weekCurrent;
          return <div key={i} className={cls} title={`第 ${i + 1} 周`} />;
        })}
      </div>
    </div>
  );
}
