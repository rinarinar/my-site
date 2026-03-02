// pages/valentine.js — 💌 情人节魔杖抽卡：输入名字 → 三张卡+摄像头 → 挥动/点击 → 揭晓 → 爱心结果页
import Head from 'next/head';
import { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../styles/Valentine.module.css';

const MOTION_SAMPLE_MS = 150;
const MOTION_THRESHOLD = 0.015;
const MOTION_FRAMES_REQUIRED = 4;
const REVEAL_DURATION_MS = 2200;

function Valentine() {
  const [phase, setPhase] = useState('name'); // 'name' | 'cards' | 'reveal' | 'result'
  const [username, setUsername] = useState('');
  const [chosenCardIndex, setChosenCardIndex] = useState(null);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const lastFrameRef = useRef(null);
  const motionCountRef = useRef(0);
  const lastImageDataRef = useRef(null);

  const startDraw = useCallback(() => {
    if (phase !== 'cards' || triggered) return;
    setTriggered(true);
    const chosen = Math.floor(Math.random() * 3);
    setChosenCardIndex(chosen);
    setPhase('reveal');
    setTimeout(() => setPhase('result'), REVEAL_DURATION_MS);
  }, [phase, triggered]);

  // 步骤 1 → 2
  const handleStart = () => {
    const name = (username || '').trim() || '你';
    setUsername(name);
    setPhase('cards');
    setTriggered(false);
    setChosenCardIndex(null);
  };

  // 摄像头：仅在 cards 阶段
  useEffect(() => {
    if (phase !== 'cards') return;
    let cancelled = false;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraAllowed(true);
      } catch (_) {
        if (!cancelled) setCameraAllowed(false);
      }
    };
    startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraAllowed(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      lastFrameRef.current = null;
      lastImageDataRef.current = null;
      motionCountRef.current = 0;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'cards' || !cameraAllowed || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
  }, [phase, cameraAllowed]);

  // 简单运动检测：定时取帧，与上一帧做亮度差
  useEffect(() => {
    if (phase !== 'cards' || !cameraAllowed || !videoRef.current || !canvasRef.current || triggered) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sample = () => {
      if (!video.videoWidth || triggered) return;
      const w = Math.min(64, video.videoWidth);
      const h = Math.min(48, video.videoHeight);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const prev = lastImageDataRef.current;
      lastImageDataRef.current = imageData;

      if (prev && prev.data.length === data.length) {
        let sum = 0;
        const step = 4 * 2;
        for (let i = 0; i < data.length; i += step) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const pr = prev.data[i], pg = prev.data[i + 1], pb = prev.data[i + 2];
          const brightness = (r + g + b) / 3 / 255;
          const pBrightness = (pr + pg + pb) / 3 / 255;
          sum += Math.abs(brightness - pBrightness);
        }
        const diff = sum / (data.length / step);
        if (diff > MOTION_THRESHOLD) {
          motionCountRef.current += 1;
          if (motionCountRef.current >= MOTION_FRAMES_REQUIRED) {
            motionCountRef.current = 0;
            startDraw();
          }
        } else {
          motionCountRef.current = 0;
        }
      }
    };

    intervalRef.current = setInterval(sample, MOTION_SAMPLE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, cameraAllowed, triggered, startDraw]);

  const displayName = (username || '').trim() || '你';

  return (
    <>
      <Head>
        <title>💌 情人节 | Rina个人网站</title>
        <meta name="description" content="情人节抽卡：挥动魔杖或点击，揭晓你的祝福" />
      </Head>

      <div className={styles.wrap}>
        {/* 步骤 1：输入名字 */}
        {phase === 'name' && (
          <div className={styles.stepName}>
            <h1 className={styles.title}>💌 情人节抽卡</h1>
            <p className={styles.hint}>输入你的名字，挥动魔杖抽取专属祝福</p>
            <input
              type="text"
              className={styles.input}
              placeholder="输入你的名字"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />
            <button type="button" className={styles.btnPrimary} onClick={handleStart}>
              开始
            </button>
          </div>
        )}

        {/* 步骤 2 & 4：三张卡 + 摄像头，或揭晓中 */}
        {(phase === 'cards' || phase === 'reveal') && (
          <div className={styles.stepCards}>
            <div className={styles.cardsRow}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`${styles.card} ${phase === 'reveal' && chosenCardIndex === i ? styles.cardRevealing : ''} ${phase === 'reveal' && chosenCardIndex !== i ? styles.cardFaded : ''}`}
                >
                  <div className={styles.cardInner}>
                    <div className={styles.cardBack} />
                    <div className={`${styles.cardFace} ${styles[`cardFace${i + 1}`]}`}>
                      <span className={styles.cardHeart}>❤️</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {phase === 'cards' && (
              <>
                <div className={styles.cameraArea}>
                  {cameraAllowed && (
                    <video ref={videoRef} autoPlay muted playsInline className={styles.video} />
                  )}
                  {!cameraAllowed && <span className={styles.cameraPlaceholder}>摄像头未开启或已拒绝</span>}
                  <canvas ref={canvasRef} className={styles.canvasHidden} width={64} height={48} />
                </div>
                <p className={styles.instruction}>对着摄像头舞动魔杖（或手指），或点击下方按钮</p>
                <button type="button" className={styles.btnWand} onClick={startDraw}>
                  或点击此处挥动魔杖
                </button>
              </>
            )}
            {phase === 'reveal' && (
              <div className={styles.heartsFloating} aria-hidden="true">
                {[...Array(12)].map((_, i) => (
                  <span key={i} className={styles.floatHeart} style={{ '--i': i }}>❤</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 步骤 5：爱心结果页 */}
        {phase === 'result' && (
          <div className={styles.stepResult}>
            <div className={styles.resultCard}>
              <p className={styles.resultText}>
                {displayName}，情人节快乐，我爱你！
              </p>
            </div>
            <button type="button" className={styles.btnAgain} onClick={() => { setPhase('name'); setUsername(''); setTriggered(false); setChosenCardIndex(null); }}>
              再玩一次
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Valentine;
