// pages/valentine.js — 💌 情人节魔杖抽卡：输入名字 → 三张卡+摄像头 → 识别到手指后提示，5s 后抽卡 → 揭晓 → 爱心结果页
import Head from 'next/head';
import { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../styles/Valentine.module.css';

const REVEAL_DURATION_MS = 4400; // 揭晓动画放慢 2 倍 (原 2200)
const HAND_DETECTED_COUNTDOWN_MS = 5000; // 识别到手指后提示显示，5s 后自动抽卡
const HAND_SAMPLE_MS = 50;

function Valentine() {
  const [phase, setPhase] = useState('name'); // 'name' | 'cards' | 'reveal' | 'result'
  const [username, setUsername] = useState('');
  const [chosenCardIndex, setChosenCardIndex] = useState(null);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [handReady, setHandReady] = useState(false);
  const [showHandPrompt, setShowHandPrompt] = useState(false); // 识别到手指后显示中央提示

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const tickRef = useRef(null);
  const triggeredRef = useRef(false);
  const handPromptShownRef = useRef(false); // 是否已弹出过提示（只弹一次）
  const countdownTimerRef = useRef(null);

  const startDraw = useCallback(() => {
    if (phase !== 'cards' || triggeredRef.current) return;
    triggeredRef.current = true;
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
    triggeredRef.current = false;
    setTriggered(false);
    setChosenCardIndex(null);
    handPromptShownRef.current = false;
    setShowHandPrompt(false);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    countdownTimerRef.current = null;
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
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'cards' || !cameraAllowed || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
  }, [phase, cameraAllowed]);

  // 加载 MediaPipe 手部识别（仅 cards 阶段且摄像头已开）
  useEffect(() => {
    if (phase !== 'cards' || !cameraAllowed) return;
    let cancelled = false;
    const initHand = async () => {
      try {
        const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        if (cancelled) return;
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        );
        if (cancelled) return;
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          },
          numHands: 1,
          runningMode: 'VIDEO',
        });
        if (cancelled) return;
        handLandmarkerRef.current = handLandmarker;
        setHandReady(true);
      } catch (e) {
        if (!cancelled) setHandReady(false);
      }
    };
    initHand();
    return () => {
      cancelled = true;
      handLandmarkerRef.current = null;
      setHandReady(false);
    };
  }, [phase, cameraAllowed]);

  // 手指识别：检测到人手后弹出中央提示，5s 后自动抽卡
  useEffect(() => {
    if (phase !== 'cards' || !cameraAllowed || !videoRef.current || !handReady || triggeredRef.current) return;
    const video = videoRef.current;
    const landmarker = handLandmarkerRef.current;
    if (!landmarker) return;

    let lastSampleTime = 0;
    const detect = (timestamp) => {
      if (triggeredRef.current) return;
      if (!video.videoWidth) {
        tickRef.current = requestAnimationFrame(detect);
        return;
      }
      const now = Date.now();
      if (now - lastSampleTime < HAND_SAMPLE_MS) {
        tickRef.current = requestAnimationFrame(detect);
        return;
      }
      lastSampleTime = now;

      try {
        const result = landmarker.detectForVideo(video, Math.round(timestamp));
        const landmarks = result?.landmarks?.[0];
        if (landmarks && landmarks.length >= 9 && !handPromptShownRef.current) {
          handPromptShownRef.current = true;
          setShowHandPrompt(true);
          countdownTimerRef.current = setTimeout(() => {
            countdownTimerRef.current = null;
            startDraw();
          }, HAND_DETECTED_COUNTDOWN_MS);
        }
      } catch (_) {}

      tickRef.current = requestAnimationFrame(detect);
    };

    const start = () => {
      if (video.videoWidth) tickRef.current = requestAnimationFrame(detect);
      else video.addEventListener('loadeddata', () => { tickRef.current = requestAnimationFrame(detect); }, { once: true });
    };
    const t = setTimeout(start, 500);
    return () => {
      clearTimeout(t);
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [phase, cameraAllowed, handReady, startDraw]);

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
                </div>
                <p className={styles.instruction}>
                  {handReady ? '把手伸入画面，识别到手指后将提示抽卡' : '正在加载手势识别…'}
                </p>
                {showHandPrompt && (
                  <div className={styles.handPromptOverlay}>
                    <p className={styles.handPromptText}>
                      识别到手指，请轻轻转动手指以抽取贺卡，5s之后抽取贺卡
                    </p>
                  </div>
                )}
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
